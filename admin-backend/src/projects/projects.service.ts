import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './projects.entity'
import { Course } from '../courses/course.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'

@Injectable()
export class ProjectsService {

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,

    // Change #8 — injected to validate courseId exists
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,

    // Change #8 — injected to validate user is enrolled
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  // Change #8 — validates course exists AND user is enrolled before accepting submission
  async submitProject(userId: number, data: any) {
    const { courseId } = data

    // Validate course exists without selecting optional columns that may be added by later migrations.
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .select(['course.id'])
      .where('course.id = :courseId', { courseId })
      .getOne()
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`)
    }

    // Validate user is enrolled in the course
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
    })
    if (!enrollment) {
      throw new BadRequestException(
        'You must be enrolled in this course to submit a project',
      )
    }

    const project = this.projectsRepository.create({ userId, ...data, status: 'pending' })
    const savedProject = await this.projectsRepository.save(project)
    await this.redisMetricsService.increment(MetricNames.projectsSubmitted)
    return savedProject
  }

  getProjectsByUser(userId: number) {
    return this.projectsRepository.find({ where: { userId } })
  }

}
