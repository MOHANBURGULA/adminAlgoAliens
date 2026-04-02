import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ActivityService } from '../activity/activity.service'
import { CacheKeys, MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'
import { RedisService } from '../redis/redis.service'
import { Evaluation } from './evaluation.entity'
import { VideoProcessingProcessor } from './video-processing.processor'
import { VideoProcessingQueueService } from './video-processing.queue'
import { VideoProcessingJobData } from './video-processing.types'

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    private readonly activityService: ActivityService,
    private readonly redisService: RedisService,
    private readonly redisMetricsService: RedisMetricsService,
    private readonly videoProcessingQueueService: VideoProcessingQueueService,
    private readonly videoProcessingProcessor: VideoProcessingProcessor,
  ) {}

  async startEvaluation(userId: number, courseId: number, videoKey: string) {
    const hasQualifiedActivity = await this.activityService.hasQualifiedActivityScore(
      userId,
      courseId,
      60,
    )
    if (!hasQualifiedActivity) {
      throw new BadRequestException(
        'You must score at least 60% in a course activity before submitting a video.',
      )
    }

    const evaluation = this.evaluationRepository.create({
      userId,
      courseId,
      videoKey,
      status: 'processing',
    })
    const savedEvaluation = await this.evaluationRepository.save(evaluation)

    await Promise.all([
      this.redisService.del(CacheKeys.dashboardUser(userId)),
      this.redisMetricsService.increment(MetricNames.evaluationSubmitted),
    ])

    const job: VideoProcessingJobData = {
      evaluationId: savedEvaluation.id,
      userId,
      courseId,
      videoKey,
    }

    const queued = await this.videoProcessingQueueService.enqueue(job)
    if (!queued) {
      this.videoProcessingProcessor.processInBackground(job)
    }

    return {
      evaluationId: savedEvaluation.id,
      status: 'processing',
      message: 'Video received. Analysis started. Check status at GET /api/evaluation/:id',
    }
  }

  getEvaluationStatus(evaluationId: number, userId: number) {
    return this.evaluationRepository.findOne({ where: { id: evaluationId, userId } })
  }

  getByUserAndCourse(userId: number, courseId: number) {
    return this.evaluationRepository.find({ where: { userId, courseId } })
  }

  async retryEvaluation(userId: number, courseId: number, videoKey: string) {
    const lastAttempt = await this.evaluationRepository.findOne({
      where: { userId, courseId },
      order: { createdAt: 'DESC' },
    })

    if (lastAttempt && lastAttempt.status === 'processing') {
      throw new BadRequestException('Your previous evaluation is still processing. Please wait.')
    }

    if (lastAttempt && lastAttempt.status === 'passed') {
      throw new BadRequestException('You have already passed the evaluation. Certificate has been issued.')
    }

    return this.startEvaluation(userId, courseId, videoKey)
  }
}
