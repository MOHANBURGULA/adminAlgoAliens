import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video } from './video.entity'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'

@Injectable()
export class VideosService {

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  async upload(userId: number, data: any) {
    const video = this.videosRepository.create({ userId, ...data, status: 'under_review' })
    const savedVideo = await this.videosRepository.save(video)
    await this.redisMetricsService.increment(MetricNames.videosSubmitted)
    return savedVideo
  }

  getUserVideos(userId: number) {
    return this.videosRepository.find({ where: { userId } })
  }

}
