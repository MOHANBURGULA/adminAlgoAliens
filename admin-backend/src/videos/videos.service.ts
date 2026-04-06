import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video } from './video.entity'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'

// Maximum rejection attempts before permanent block (Change #5)
const MAX_REJECTIONS = Number(process.env.MAX_VIDEO_REJECTIONS || '4')

@Injectable()
export class VideosService {

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  async upload(userId: number, data: any) {
    const video = this.videosRepository.create({
      userId,
      ...data,
      status: 'under_review',
      rejectionCount: 0,
    })
    const savedVideo = await this.videosRepository.save(video)
    await this.redisMetricsService.increment(MetricNames.videosSubmitted)
    return savedVideo
  }

  // Change #14 — returns status, feedback, rejectionCount so user sees review state
  async getUserVideos(userId: number) {
    const videos = await this.videosRepository.find({ where: { userId } })
    return videos.map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      videoUrl: v.videoUrl,
      // human-readable status label for frontend
      status: this.mapStatusLabel(v.status),
      rawStatus: v.status,
      feedback: v.feedback || null,
      rejectionCount: v.rejectionCount,
      attemptsRemaining: Math.max(0, MAX_REJECTIONS - v.rejectionCount),
      createdAt: v.createdAt,
    }))
  }

  private mapStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      under_review: 'Pending approval',
      approved: 'Approved',
      rejected: 'Rejected',
      permanently_rejected: 'Permanently rejected — no more attempts allowed',
    }
    return labels[status] || status
  }

}
