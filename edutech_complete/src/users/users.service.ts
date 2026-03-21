import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import { UserProfile } from './user-profile.entity'
import * as bcrypt from 'bcrypt'

import { JwtService } from '@nestjs/jwt'

@Injectable()
export class UsersService {
  generateJwt(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  }

constructor(
  @InjectRepository(User) private userRepo: Repository<User>,
  @InjectRepository(UserProfile) private profileRepo: Repository<UserProfile>,
  private jwtService: JwtService
) {}

  async create(data: any): Promise<User> {
    const user = this.userRepo.create(data)
    const saved = await this.userRepo.save(user)
    return saved as unknown as User
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } })
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } })
  }

  async updateUser(id: number, data: { name?: string; password?: string }): Promise<User | null> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    await this.userRepo.update(id, data)
    return this.userRepo.findOne({ where: { id } })
  }

  async updateRole(id: number, role: string): Promise<User | null> {
    await this.userRepo.update(id, { role })
    return this.userRepo.findOne({ where: { id } })
  }

  async createProfile(userId: number, data: any): Promise<UserProfile | null> {
    const existing = await this.profileRepo.findOne({ where: { userId } })
    if (existing) {
      await this.profileRepo.update(
  { userId },
  {
    skillLevel: data.skillLevel,
    interests: data.interests,
    goal: data.goal
  }
)
      return this.profileRepo.findOne({ where: { userId } })
    }
    const profile = this.profileRepo.create({
    userId,
    skillLevel: data.skillLevel,
    interests: data.interests,
    goal: data.goal   // ✅ NOW VALID
  })
    const saved = await this.profileRepo.save(profile)
    return saved as unknown as UserProfile
  }

  async getProfile(userId: number): Promise<UserProfile> {
  const profile = await this.profileRepo.findOne({
    where: { userId }
  })

  if (!profile) {
    throw new NotFoundException("Profile not found")
  }

  return profile
}

}
