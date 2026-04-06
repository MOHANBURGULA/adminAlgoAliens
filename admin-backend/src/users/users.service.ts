import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { User } from './user.entity'
import { UserProfile } from './user-profile.entity'
import { CreateUserInput, UpdateUserPayload, UserProfilePayload } from './users.types'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserProfile) private profileRepo: Repository<UserProfile>,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  generateJwt(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private isPasswordHash(password: string) {
    return /^\$2[aby]\$\d{2}\$/.test(password)
  }

  private async normalizeStoredPassword(password: string) {
    if (password === 'GOOGLE_AUTH' || this.isPasswordHash(password)) {
      return password
    }

    return bcrypt.hash(password, 10)
  }

  private normalizeInterests(value: unknown) {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean)
  }

  private sanitizeUpdateUserPayload(data: UpdateUserPayload): UpdateUserPayload {
    const nextData: UpdateUserPayload = {}

    if (typeof data.name === 'string') {
      const nextName = data.name.trim()
      if (nextName) {
        nextData.name = nextName
      }
    }

    if (typeof data.password === 'string' && data.password.trim()) {
      nextData.password = data.password
    }

    return nextData
  }

  private sanitizeProfilePayload(data: Partial<UserProfilePayload>): UserProfilePayload {
    return {
      skillLevel: typeof data.skillLevel === 'string' ? data.skillLevel.trim() : '',
      interests: this.normalizeInterests(data.interests),
      goal:
        typeof data.goal === 'string' && data.goal.trim() ? data.goal.trim() : 'Not set',
    }
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = this.userRepo.create({
      ...data,
      email: this.normalizeEmail(data.email),
      name: data.name.trim(),
      password: await this.normalizeStoredPassword(data.password),
    })
    const saved = await this.userRepo.save(user)
    return saved as User
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email: this.normalizeEmail(email) } })
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } })
  }

  async updateUser(id: number, data: UpdateUserPayload): Promise<User | null> {
    const sanitizedData = this.sanitizeUpdateUserPayload(data)

    if (sanitizedData.password) {
      sanitizedData.password = await this.normalizeStoredPassword(sanitizedData.password)
    }

    if (Object.keys(sanitizedData).length === 0) {
      return this.userRepo.findOne({ where: { id } })
    }

    await this.userRepo.update(id, sanitizedData)
    return this.userRepo.findOne({ where: { id } })
  }

  async setPasswordHash(id: number, passwordHash: string): Promise<User | null> {
    await this.userRepo.update(id, { password: passwordHash })
    return this.userRepo.findOne({ where: { id } })
  }

  async updateRole(id: number, role: string): Promise<User | null> {
    await this.userRepo.update(id, { role })
    return this.userRepo.findOne({ where: { id } })
  }

  async createProfile(
    userId: number,
    data: Partial<UserProfilePayload>,
  ): Promise<UserProfile | null> {
    const profileData = this.sanitizeProfilePayload(data)
    const existing = await this.profileRepo.findOne({ where: { userId } })

    if (existing) {
      await this.profileRepo.update({ userId }, profileData)
      const updatedProfile = await this.profileRepo.findOne({ where: { userId } })
      await this.redisService.del(CacheKeys.profileUser(userId))
      return updatedProfile
    }

    const profile = this.profileRepo.create({
      userId,
      ...profileData,
    })
    const saved = await this.profileRepo.save(profile)
    await this.redisService.del(CacheKeys.profileUser(userId))
    return saved as UserProfile
  }

  async getProfile(userId: number): Promise<UserProfile | null> {
    const cacheKey = CacheKeys.profileUser(userId)
    const cachedProfile = await this.redisService.getCache<UserProfile>(cacheKey)
    if (cachedProfile !== null) {
      return cachedProfile
    }

    const profile = await this.profileRepo.findOne({
      where: { userId },
    })

    if (profile) {
      await this.redisService.setCache(
        cacheKey,
        profile,
        CACHE_TTL_SECONDS.profileUser,
      )
    }

    return profile || null
  }
}
