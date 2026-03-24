import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Queue, Worker } from 'bullmq'
import { RedisService } from '../redis/redis.service'
import { VideoProcessingProcessor } from './video-processing.processor'
import { VIDEO_PROCESSING_QUEUE_NAME, VideoProcessingJobData } from './video-processing.types'

@Injectable()
export class VideoProcessingQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoProcessingQueueService.name)
  private queue: Queue<VideoProcessingJobData> | null = null
  private worker: Worker<VideoProcessingJobData> | null = null
  private enabled = false
  private failureHandled = false

  constructor(
    private readonly redisService: RedisService,
    private readonly videoProcessingProcessor: VideoProcessingProcessor,
  ) {}

  async onModuleInit() {
    const redisReachable = await this.redisService.ping()
    if (!redisReachable) {
      this.enabled = false
      this.logger.warn(
        `BullMQ disabled for "${VIDEO_PROCESSING_QUEUE_NAME}" because Redis is unavailable. Falling back to in-process evaluation.`,
      )
      return
    }

    const maxMemoryPolicy = await this.redisService.getConfigValue('maxmemory-policy')
    if (maxMemoryPolicy && maxMemoryPolicy !== 'noeviction') {
      this.logger.warn(
        `Redis maxmemory-policy is "${maxMemoryPolicy}". BullMQ is safest with "noeviction".`,
      )
    }

    try {
      const connection = this.redisService.getBullMqConnection()

      this.queue = new Queue<VideoProcessingJobData>(VIDEO_PROCESSING_QUEUE_NAME, {
        connection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 100,
          attempts: 1,
        },
      })

      this.worker = new Worker<VideoProcessingJobData>(
        VIDEO_PROCESSING_QUEUE_NAME,
        async (job) => {
          await this.videoProcessingProcessor.process(job.data)
        },
        {
          connection,
          concurrency: 2,
        },
      )

      this.queue.on('error', (error) => {
        void this.handleInfrastructureFailure('queue', error)
      })

      this.worker.on('error', (error) => {
        void this.handleInfrastructureFailure('worker', error)
      })

      this.enabled = true
      this.logger.log(`BullMQ queue "${VIDEO_PROCESSING_QUEUE_NAME}" initialized`)
    } catch (error) {
      this.enabled = false
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`BullMQ unavailable. Falling back to in-process evaluation: ${message}`)
      void this.closeResources()
    }
  }

  async enqueue(job: VideoProcessingJobData) {
    if (!this.enabled || !this.queue) {
      return false
    }

    try {
      await this.queue.add('evaluate-video', job, {
        jobId: `evaluation:${job.evaluationId}`,
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`BullMQ enqueue failed for evaluation ${job.evaluationId}: ${message}`)
      return false
    }
  }

  async onModuleDestroy() {
    await this.closeResources()
  }

  private async closeResources() {
    if (this.worker) {
      await this.worker.close().catch(() => undefined)
      this.worker = null
    }

    if (this.queue) {
      await this.queue.close().catch(() => undefined)
      this.queue = null
    }
  }

  private async handleInfrastructureFailure(source: 'queue' | 'worker', error: unknown) {
    if (this.failureHandled) {
      return
    }

    this.failureHandled = true
    this.enabled = false

    const message =
      error instanceof Error && error.message?.trim()
        ? error.message.trim()
        : 'Unknown BullMQ connection error'

    this.logger.warn(
      `BullMQ ${source} failed for "${VIDEO_PROCESSING_QUEUE_NAME}": ${message}. Falling back to in-process evaluation.`,
    )

    await this.closeResources()
  }
}
