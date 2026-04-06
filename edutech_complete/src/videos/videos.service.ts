import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ActivityService } from '../activity/activity.service'
import { Video } from './video.entity'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'
import { CreateVideoInput } from './videos.types'

@Injectable()
export class VideosService {

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private readonly activityService: ActivityService,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  async upload(userId: number, data: CreateVideoInput) {
    const courseId = Number(data.courseId)
    const title = data.title?.trim()
    const description = data.description?.trim()
    const videoUrl = data.videoUrl?.trim()

    if (!courseId) {
      throw new BadRequestException('Course id is required to upload a video')
    }

    if (!title) {
      throw new BadRequestException('Title is required to upload a video')
    }

    if (!description) {
      throw new BadRequestException('Description is required to upload a video')
    }

    if (!videoUrl) {
      throw new BadRequestException('Video URL is required to upload a video')
    }

    const hasQualifiedActivity = await this.activityService.hasQualifiedActivityScore(
      userId,
      courseId,
      60,
    )

    if (!hasQualifiedActivity) {
      throw new BadRequestException(
        'You must score at least 60% in a course activity before uploading a video.',
      )
    }

    const video = this.videosRepository.create({
      userId,
      courseId,
      title,
      description,
      videoUrl,
      status: 'under_review',
    })
    const savedVideo = await this.videosRepository.save(video)
    await this.redisMetricsService.increment(MetricNames.videosSubmitted)
    return savedVideo
  }

  getUserVideos(userId: number) {
    return this.videosRepository.find({ where: { userId } })
  }

}
