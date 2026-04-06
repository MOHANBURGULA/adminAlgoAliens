import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'
import { Course } from './course.entity'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name)

  constructor(
    @InjectRepository(Course)
    private repo: Repository<Course>,
    private readonly redisService: RedisService,
  ) {}

  async getCourses() {
    const cacheKey = CacheKeys.coursesAll()
    const cachedCourses = await this.redisService.getCache<Course[]>(cacheKey)
    if (cachedCourses !== null) {
      return cachedCourses
    }

    const courses = await this.findCoursesSafely()
    await this.redisService.setCache(cacheKey, courses, CACHE_TTL_SECONDS.coursesAll)
    return courses
  }

  getCourseById(id: number) {
    return this.findCourseByIdSafely(id)
  }

  async searchByKeyword(keyword: string): Promise<Course[]> {
    const q = keyword.trim().toLowerCase()

    try {
      return await this.repo
        .createQueryBuilder('course')
        .where('LOWER(course.title) LIKE :q', { q: `%${q}%` })
        .orWhere('LOWER(course.description) LIKE :q', { q: `%${q}%` })
        .orWhere('LOWER(course.keywords) LIKE :q', { q: `%${q}%` })
        .getMany()
    } catch (error) {
      if (!this.isMissingCourseColumnError(error)) {
        throw error
      }

      this.logger.warn(
        'Course search fallback triggered because optional course columns are missing. Run pending migrations.',
      )

      const rows = await this.repo
        .createQueryBuilder('course')
        .select([
          'course.id AS id',
          'course.title AS title',
          'course.difficulty AS difficulty',
          'course.createdAt AS "createdAt"',
        ])
        .where('LOWER(course.title) LIKE :q', { q: `%${q}%` })
        .orderBy('course.createdAt', 'DESC')
        .getRawMany()

      return rows.map((row) => this.mapSafeCourseRow(row))
    }
  }

  private async findCoursesSafely() {
    try {
      return await this.repo.find()
    } catch (error) {
      if (!this.isMissingCourseColumnError(error)) {
        throw error
      }

      this.logger.warn(
        'Course list fallback triggered because optional course columns are missing. Run pending migrations.',
      )

      const rows = await this.repo
        .createQueryBuilder('course')
        .select([
          'course.id AS id',
          'course.title AS title',
          'course.difficulty AS difficulty',
          'course.createdAt AS "createdAt"',
        ])
        .orderBy('course.createdAt', 'DESC')
        .getRawMany()

      return rows.map((row) => this.mapSafeCourseRow(row))
    }
  }

  private async findCourseByIdSafely(id: number) {
    try {
      return await this.repo.findOne({ where: { id } })
    } catch (error) {
      if (!this.isMissingCourseColumnError(error)) {
        throw error
      }

      this.logger.warn(
        `Course detail fallback triggered for course ${id} because optional course columns are missing. Run pending migrations.`,
      )

      const row = await this.repo
        .createQueryBuilder('course')
        .select([
          'course.id AS id',
          'course.title AS title',
          'course.difficulty AS difficulty',
          'course.createdAt AS "createdAt"',
        ])
        .where('course.id = :id', { id })
        .getRawOne()

      return row ? this.mapSafeCourseRow(row) : null
    }
  }

  private mapSafeCourseRow(row: {
    createdAt?: Date | string
    difficulty?: string
    id: number | string
    title?: string
  }): Course {
    return {
      id: Number(row.id),
      title: row.title ?? '',
      difficulty: row.difficulty ?? '',
      description: null,
      keywords: null,
      categoryId: null,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    }
  }

  private isMissingCourseColumnError(error: unknown) {
    return (
      error instanceof QueryFailedError &&
      typeof error.message === 'string' &&
      error.message.includes('column') &&
      error.message.includes('Course.')
    )
  }
}
