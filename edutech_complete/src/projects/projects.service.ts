import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './projects.entity'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'

@Injectable()
export class ProjectsService {

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  async submitProject(userId: number, data: any) {
    const project = this.projectsRepository.create({ userId, ...data, status: 'pending' })
    const savedProject = await this.projectsRepository.save(project)
    await this.redisMetricsService.increment(MetricNames.projectsSubmitted)
    return savedProject
  }

  getProjectsByUser(userId: number) {
    return this.projectsRepository.find({ where: { userId } })
  }

}
