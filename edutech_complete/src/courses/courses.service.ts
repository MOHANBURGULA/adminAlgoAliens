import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Course } from './course.entity'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class CoursesService {

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

    const courses = await this.repo.find()
    await this.redisService.setCache(cacheKey, courses, CACHE_TTL_SECONDS.coursesAll)
    return courses
  }

  getCourseById(id: number) {
    return this.repo.findOne({ where: { id } })
  }

}
