import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { UserProfile } from './user-profile.entity';
import {
  CompleteOnboardingPayload,
  CreateUserInput,
  UpdateLearningProfilePayload,
  UpdateUserPayload,
  UserProfileResponse,
} from './users.types';
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers';
import { RedisService } from '../redis/redis.service';

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
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private isPasswordHash(password: string) {
    return /^\$2[aby]\$\d{2}\$/.test(password);
  }

  private async normalizeStoredPassword(password: string) {
    if (password === 'GOOGLE_AUTH' || this.isPasswordHash(password)) {
      return password;
    }

    return bcrypt.hash(password, 10);
  }

  private normalizeString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter(Boolean),
      ),
    );
  }

  private sanitizeUpdateUserPayload(
    data: UpdateUserPayload,
  ): UpdateUserPayload {
    const nextData: UpdateUserPayload = {};

    if (typeof data.name === 'string') {
      const nextName = data.name.trim();
      if (nextName) {
        nextData.name = nextName;
      }
    }

    if (typeof data.password === 'string' && data.password.trim()) {
      nextData.password = data.password;
    }

    return nextData;
  }

  private getDefaultOnboardingRole(user: User | null) {
    if (!user) {
      return '';
    }

    return user.role === 'admin' ? 'Professional' : 'Student';
  }

  private getCareerGoal(profile: UserProfile | null) {
    if (!profile) {
      return '';
    }

    const nextCareerGoal = this.normalizeString(profile.career_goal);
    if (nextCareerGoal) {
      return nextCareerGoal;
    }

    const legacyGoal = this.normalizeString(profile.goal);
    return legacyGoal === 'Not set' ? '' : legacyGoal;
  }

  private getSkillDomains(profile: UserProfile | null) {
    if (!profile) {
      return [];
    }

    const nextDomains = this.normalizeStringArray(profile.skill_domains);
    if (nextDomains.length > 0) {
      return nextDomains;
    }

    return this.normalizeStringArray(profile.interests);
  }

  private hasLegacyCompletedProfile(profile: UserProfile | null) {
    if (!profile) {
      return false;
    }

    return Boolean(
      this.normalizeString(profile.skillLevel) &&
      this.getCareerGoal(profile) &&
      this.getSkillDomains(profile).length > 0,
    );
  }

  private serializeProfile(
    userId: number,
    profile: UserProfile | null,
    user: User | null,
  ): UserProfileResponse {
    const careerGoal = this.getCareerGoal(profile);
    const skillDomains = this.getSkillDomains(profile);
    const onboardingCompleted = Boolean(
      profile?.onboarding_completed || this.hasLegacyCompletedProfile(profile),
    );
    const role =
      this.normalizeString(profile?.role) ||
      (onboardingCompleted ? this.getDefaultOnboardingRole(user) : '');

    return {
      userId,
      role,
      career_goal: careerGoal,
      skill_domains: skillDomains,
      skillLevel: this.normalizeString(profile?.skillLevel),
      coding_experience: profile?.coding_experience ?? null,
      weekly_hours: this.normalizeString(profile?.weekly_hours),
      target_timeline: this.normalizeString(profile?.target_timeline),
      onboarding_completed: onboardingCompleted,
      goal: careerGoal,
      interests: skillDomains,
    };
  }

  private sanitizeOnboardingPayload(
    data: CompleteOnboardingPayload,
  ): CompleteOnboardingPayload {
    return {
      role: this.normalizeString(data.role),
      career_goal: this.normalizeString(data.career_goal),
      skill_domains: this.normalizeStringArray(data.skill_domains),
      skillLevel: this.normalizeString(data.skillLevel),
      coding_experience: Boolean(data.coding_experience),
      weekly_hours: this.normalizeString(data.weekly_hours),
      target_timeline: this.normalizeString(data.target_timeline),
      onboarding_completed: true,
    };
  }

  private buildLearningProfileUpdate(data: UpdateLearningProfilePayload) {
    const nextData: Partial<UserProfile> = {};

    if (typeof data.skillLevel === 'string') {
      nextData.skillLevel = this.normalizeString(data.skillLevel);
    }

    if (typeof data.career_goal === 'string' || typeof data.goal === 'string') {
      const nextGoal = this.normalizeString(data.career_goal ?? data.goal);
      nextData.career_goal = nextGoal;
      nextData.goal = nextGoal || 'Not set';
    }

    if (Array.isArray(data.skill_domains) || Array.isArray(data.interests)) {
      const nextDomains = this.normalizeStringArray(
        data.skill_domains ?? data.interests,
      );
      nextData.skill_domains = nextDomains;
      nextData.interests = nextDomains;
    }

    return nextData;
  }

  private async backfillLegacyProfile(
    userId: number,
    user: User | null,
    profile: UserProfile | null,
  ) {
    if (
      !profile ||
      profile.onboarding_completed ||
      !this.hasLegacyCompletedProfile(profile)
    ) {
      return profile;
    }

    const careerGoal = this.getCareerGoal(profile);
    const skillDomains = this.getSkillDomains(profile);

    await this.profileRepo.update(
      { userId },
      {
        role:
          this.normalizeString(profile.role) ||
          this.getDefaultOnboardingRole(user),
        career_goal: careerGoal,
        skill_domains: skillDomains,
        goal: careerGoal || 'Not set',
        interests: skillDomains,
        onboarding_completed: true,
      },
    );

    return this.profileRepo.findOne({ where: { userId } });
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = this.userRepo.create({
      ...data,
      email: this.normalizeEmail(data.email),
      name: data.name.trim(),
      password: await this.normalizeStoredPassword(data.password),
    });
    const saved = await this.userRepo.save(user);
    return saved as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async updateUser(id: number, data: UpdateUserPayload): Promise<User | null> {
    const sanitizedData = this.sanitizeUpdateUserPayload(data);

    if (sanitizedData.password) {
      sanitizedData.password = await this.normalizeStoredPassword(
        sanitizedData.password,
      );
    }

    if (Object.keys(sanitizedData).length === 0) {
      return this.userRepo.findOne({ where: { id } });
    }

    await this.userRepo.update(id, sanitizedData);
    return this.userRepo.findOne({ where: { id } });
  }

  async setPasswordHash(
    id: number,
    passwordHash: string,
  ): Promise<User | null> {
    await this.userRepo.update(id, { password: passwordHash });
    return this.userRepo.findOne({ where: { id } });
  }

  async updateRole(id: number, role: string): Promise<User | null> {
    await this.userRepo.update(id, { role });
    await this.redisService.del(CacheKeys.profileUser(id));
    return this.userRepo.findOne({ where: { id } });
  }

  async createProfile(
    userId: number,
    data: UpdateLearningProfilePayload,
  ): Promise<UserProfileResponse> {
    const profileData = this.buildLearningProfileUpdate(data);
    const existing = await this.profileRepo.findOne({ where: { userId } });

    if (existing && Object.keys(profileData).length === 0) {
      return this.getProfile(userId);
    }

    if (existing) {
      await this.profileRepo.update({ userId }, profileData);
      await this.redisService.del(CacheKeys.profileUser(userId));
      return this.getProfile(userId);
    }

    const profile = this.profileRepo.create({
      userId,
      role: '',
      career_goal: '',
      skill_domains: [],
      skillLevel: '',
      coding_experience: null,
      weekly_hours: '',
      target_timeline: '',
      onboarding_completed: false,
      interests: [],
      goal: 'Not set',
      ...profileData,
    });
    await this.profileRepo.save(profile);
    await this.redisService.del(CacheKeys.profileUser(userId));
    return this.getProfile(userId);
  }

  async completeOnboarding(
    userId: number,
    data: CompleteOnboardingPayload,
  ): Promise<UserProfileResponse> {
    const currentProfile = await this.getProfile(userId);

    if (currentProfile.onboarding_completed) {
      return currentProfile;
    }

    const profileData = this.sanitizeOnboardingPayload(data);
    const existing = await this.profileRepo.findOne({ where: { userId } });
    const nextProfileData: Partial<UserProfile> = {
      role: profileData.role,
      career_goal: profileData.career_goal,
      skill_domains: profileData.skill_domains,
      skillLevel: profileData.skillLevel,
      coding_experience: profileData.coding_experience,
      weekly_hours: profileData.weekly_hours,
      target_timeline: profileData.target_timeline,
      onboarding_completed: true,
      goal: profileData.career_goal || 'Not set',
      interests: profileData.skill_domains,
    };

    if (existing) {
      await this.profileRepo.update({ userId }, nextProfileData);
    } else {
      await this.profileRepo.save(
        this.profileRepo.create({
          userId,
          ...nextProfileData,
        }),
      );
    }

    await this.redisService.del(CacheKeys.profileUser(userId));
    return this.getProfile(userId);
  }

  async getProfile(userId: number): Promise<UserProfileResponse> {
    const cacheKey = CacheKeys.profileUser(userId);
    const cachedProfile =
      await this.redisService.getCache<UserProfileResponse>(cacheKey);
    if (cachedProfile !== null) {
      return cachedProfile;
    }

    const [user, rawProfile] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.profileRepo.findOne({ where: { userId } }),
    ]);
    const profile = await this.backfillLegacyProfile(userId, user, rawProfile);
    const serializedProfile = this.serializeProfile(userId, profile, user);

    await this.redisService.setCache(
      cacheKey,
      serializedProfile,
      CACHE_TTL_SECONDS.profileUser,
    );

    return serializedProfile;
  }
}
