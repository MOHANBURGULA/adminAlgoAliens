import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CourseModule } from './module.entity'
import { ModuleDocument } from './module-document.entity'
import { ModuleProgress } from './module-progress.entity'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class ModulesService {

  constructor(
    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,

    @InjectRepository(ModuleDocument)
    private documentRepo: Repository<ModuleDocument>,

    @InjectRepository(ModuleProgress)
    private progressRepo: Repository<ModuleProgress>,

    private readonly redisService: RedisService,
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

  // Get documents (PDFs) for a module
  async getDocumentsByModule(moduleId: number) {
    const cacheKey = CacheKeys.moduleDocuments(moduleId)
    const cachedDocuments = await this.redisService.getCache<ModuleDocument[]>(cacheKey)
    if (cachedDocuments !== null) {
      return cachedDocuments
    }

    const documents = await this.documentRepo.find({ where: { moduleId } })
    await this.redisService.setCache(
      cacheKey,
      documents,
      CACHE_TTL_SECONDS.moduleDocuments,
    )

    return documents
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

}
