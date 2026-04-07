import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ModuleActivity } from './module-activity.entity'
import { CourseModule } from './module.entity'
import { ModuleDocument } from './module-document.entity'
import { ModuleProgress } from './module-progress.entity'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'
import { S3Service } from '../s3/s3.service'

@Injectable()
export class ModulesService {

  constructor(
    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,

    @InjectRepository(ModuleActivity)
    private activityRepo: Repository<ModuleActivity>,

    @InjectRepository(ModuleDocument)
    private documentRepo: Repository<ModuleDocument>,

    @InjectRepository(ModuleProgress)
    private progressRepo: Repository<ModuleProgress>,

    private readonly redisService: RedisService,
    private readonly s3Service: S3Service,
  ) {}

  // Get all modules for a course (ordered)
  async getModulesByCourse(courseId: number) {
    const cacheKey = CacheKeys.modulesCourse(courseId)
    const cachedModules = await this.redisService.getCache<CourseModule[]>(cacheKey)
    if (cachedModules !== null) {
      return cachedModules
    }

    const modules = await this.moduleRepo.find({
      where: { courseId },
      order: { orderIndex: 'ASC' }
    })

    await this.redisService.setCache(
      cacheKey,
      modules,
      CACHE_TTL_SECONDS.modulesCourse,
    )

    return modules
  }

  // Get documents (.md files) for a module
  async getDocumentsByModule(moduleId: number) {
    const cacheKey = CacheKeys.moduleDocuments(moduleId)
    const cachedDocuments = await this.redisService.getCache<ModuleDocument[]>(cacheKey)
    if (cachedDocuments !== null) {
      return this.attachDocumentAccessUrls(cachedDocuments)
    }

    const documents = await this.documentRepo.find({ where: { moduleId } })
    await this.redisService.setCache(
      cacheKey,
      documents,
      CACHE_TTL_SECONDS.moduleDocuments,
    )

    return this.attachDocumentAccessUrls(documents)
  }

  async getActivitiesByModule(moduleId: number) {
    const cacheKey = CacheKeys.moduleActivities(moduleId)
    const cachedActivities = await this.redisService.getCache<ModuleActivity[]>(cacheKey)
    if (cachedActivities !== null) {
      return cachedActivities.map((activity) => this.sanitizeActivityForLearner(activity))
    }

    const activities = await this.activityRepo.find({
      where: { moduleId },
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    })

    await this.redisService.setCache(
      cacheKey,
      activities,
      CACHE_TTL_SECONDS.moduleActivities,
    )

    return activities.map((activity) => this.sanitizeActivityForLearner(activity))
  }

  // Mark a module as completed for a user (called after passing module quiz)
  async markModuleComplete(userId: number, courseId: number, moduleId: number, quizScore: number) {
    const existing = await this.progressRepo.findOne({ where: { userId, moduleId } })

    if (existing) {
      await this.progressRepo.update(existing.id, {
        completed: true,
        quizScore,
        completedAt: new Date()
      })
      const updatedProgress = await this.progressRepo.findOne({ where: { id: existing.id } })
      await this.invalidateProgressViews(userId, courseId)
      return updatedProgress
    }

    const record = this.progressRepo.create({
      userId, courseId, moduleId,
      completed: true,
      quizScore,
      completedAt: new Date()
    })
    const savedRecord = await this.progressRepo.save(record)
    await this.invalidateProgressViews(userId, courseId)
    return savedRecord
  }

  // Get progress for all modules in a course for a user
  async getUserCourseProgress(userId: number, courseId: number) {
    const cacheKey = CacheKeys.moduleProgressUserCourse(userId, courseId)
    const cachedProgress = await this.redisService.getCache<ModuleProgress[]>(cacheKey)
    if (cachedProgress !== null) {
      return cachedProgress
    }

    const progress = await this.progressRepo.find({ where: { userId, courseId } })
    await this.redisService.setCache(
      cacheKey,
      progress,
      CACHE_TTL_SECONDS.moduleProgressUserCourse,
    )

    return progress
  }

  // Check if all 5 modules are completed for a user in a course
  async allModulesCompleted(userId: number, courseId: number): Promise<boolean> {
    const modules = await this.moduleRepo.find({ where: { courseId } })
    const completed = await this.progressRepo.find({ where: { userId, courseId, completed: true } })
    return completed.length >= modules.length && modules.length > 0
  }

  private async invalidateProgressViews(userId: number, courseId: number) {
    await this.redisService.del(
      CacheKeys.moduleProgressUserCourse(userId, courseId),
      CacheKeys.dashboardUser(userId),
    )
  }

  private sanitizeActivityForLearner(activity: ModuleActivity) {
    return {
      ...activity,
      config: this.sanitizeActivityConfig(activity.activityType, activity.config),
    }
  }

  private sanitizeActivityConfig(activityType: string, config: Record<string, unknown>) {
    if (!config || typeof config !== 'object') {
      return {}
    }

    if (activityType === 'coding' || activityType === 'sql_debugging') {
      const testCases = Array.isArray(config.testCases) ? config.testCases : []

      return {
        ...config,
        testCases: testCases
          .filter((testCase) => !this.isHiddenTestCase(testCase))
          .map((testCase) => this.stripHiddenFlag(testCase)),
      }
    }

    if (activityType === 'quiz') {
      const questions = Array.isArray(config.questions) ? config.questions : []

      return {
        ...config,
        questions: questions.map((question) => this.stripQuizAnswers(question)),
      }
    }

    return { ...config }
  }

  private isHiddenTestCase(testCase: unknown) {
    return Boolean(
      testCase &&
        typeof testCase === 'object' &&
        'isHidden' in testCase &&
        (testCase as { isHidden?: unknown }).isHidden,
    )
  }

  private stripHiddenFlag(testCase: unknown) {
    if (!testCase || typeof testCase !== 'object') {
      return testCase
    }

    const { isHidden: _isHidden, ...rest } = testCase as Record<string, unknown>
    return {
      ...rest,
      isHidden: false,
    }
  }

  private stripQuizAnswers(question: unknown) {
    if (!question || typeof question !== 'object') {
      return question
    }

    const {
      correctOptionIndex: _correctOptionIndex,
      correctOption: _correctOption,
      answer: _answer,
      ...rest
    } = question as Record<string, unknown>

    return rest
  }

  private attachDocumentAccessUrls(documents: ModuleDocument[]) {
    return Promise.all(
      documents.map(async (document) => ({
        ...document,
        accessUrl: await this.s3Service.getDownloadUrl(document.fileUrl),
      })),
    )
  }
}
