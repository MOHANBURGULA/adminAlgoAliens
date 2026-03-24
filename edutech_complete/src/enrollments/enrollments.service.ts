import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Enrollment } from './enrollment.entity'
import { CertificatesService } from '../certificates/certificates.service'
import {
  CACHE_TTL_SECONDS,
  CacheKeys,
  MetricNames,
} from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'
import { RedisService } from '../redis/redis.service'
import { Course } from '../courses/course.entity'

@Injectable()
export class EnrollmentsService {

  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Course)
    private courseRepository: Repository<Course>,

    private certificatesService: CertificatesService,
    private readonly redisService: RedisService,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  async enroll(userId: number, courseId: number) {
    const enrollment = this.enrollmentRepository.create({ userId, courseId, progress: 0 })
    const savedEnrollment = await this.enrollmentRepository.save(enrollment)

    await Promise.all([
      this.invalidateUserEnrollmentViews(userId),
      this.redisMetricsService.increment(MetricNames.enrollmentsCreated),
    ])

    return savedEnrollment
  }

  async getByUser(userId: number) {
    const cacheKey = CacheKeys.enrollmentsUser(userId)
    const cachedEnrollments = await this.redisService.getCache<Enrollment[]>(cacheKey)
    const enrollments =
      cachedEnrollments !== null
        ? cachedEnrollments
        : await this.enrollmentRepository.find({ where: { userId } })

    if (cachedEnrollments === null) {
      await this.redisService.setCache(
        cacheKey,
        enrollments,
        CACHE_TTL_SECONDS.enrollmentsUser,
      )
    }

    await this.ensureUserCoursesCache(userId, enrollments)
    return enrollments
  }

  async updateProgress(enrollmentId: number, progress: number) {
    await this.enrollmentRepository.update(enrollmentId, { progress })
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } })

    if (progress >= 100 && enrollment) {
      await this.certificatesService.issueCertificate(enrollment.userId, enrollment.courseId)
    }

    if (enrollment) {
      await this.invalidateUserEnrollmentViews(enrollment.userId)
    }

    return enrollment
  }

  async unenroll(userId: number, enrollmentId: number) {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } })
    if (!enrollment) throw new NotFoundException('Enrollment not found')
    if (enrollment.userId !== userId) throw new ForbiddenException('Not your enrollment')
    await this.enrollmentRepository.delete(enrollmentId)
    await this.invalidateUserEnrollmentViews(userId)
    return { message: 'Unenrolled successfully' }
  }

  private async invalidateUserEnrollmentViews(userId: number) {
    await this.redisService.del(
      CacheKeys.coursesAll(),
      CacheKeys.coursesUser(userId),
      CacheKeys.enrollmentsUser(userId),
      CacheKeys.dashboardUser(userId),
    )
  }

  private async ensureUserCoursesCache(userId: number, enrollments: Enrollment[]) {
    const userCoursesCacheKey = CacheKeys.coursesUser(userId)
    const cachedUserCourses = await this.redisService.getCache<Course[]>(userCoursesCacheKey)

    if (cachedUserCourses !== null) {
      return cachedUserCourses
    }

    const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.courseId)))
    const userCourses =
      courseIds.length > 0
        ? await this.courseRepository.find({
            where: { id: In(courseIds) },
          })
        : []

    await this.redisService.setCache(
      userCoursesCacheKey,
      userCourses,
      CACHE_TTL_SECONDS.coursesUser,
    )

    return userCourses
  }

}
