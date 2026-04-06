import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CertificatesService } from '../certificates/certificates.service'
import { CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'
import { OpenAiService } from '../openai/openai.service'
import { QuestionsService } from '../questions/questions.service'
import { S3Service } from '../s3/s3.service'
import { Evaluation } from './evaluation.entity'
import { VideoProcessingJobData } from './video-processing.types'

const CERTIFICATE_SCORE_THRESHOLD = 70

@Injectable()
export class VideoProcessingProcessor {
  private readonly logger = new Logger(VideoProcessingProcessor.name)

  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    private readonly openAiService: OpenAiService,
    private readonly questionsService: QuestionsService,
    private readonly certificatesService: CertificatesService,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
  ) {}

  async process(job: VideoProcessingJobData) {
    const { evaluationId, userId, courseId, videoKey } = job

    try {
      const videoBuffer = await this.loadVideoBuffer(videoKey)
      const transcript = await this.openAiService.transcribeVideo(
        videoBuffer,
        `eval-${evaluationId}.mp4`,
      )
      const expectedAnswers = await this.questionsService.getExpectedAnswers(courseId)
      const { relevanceScore, aiDetectionScore, finalScore, feedback } =
        await this.openAiService.evaluateTranscript(transcript, expectedAnswers)

      const passed = finalScore >= CERTIFICATE_SCORE_THRESHOLD

      await this.evaluationRepository.update(evaluationId, {
        transcript,
        relevanceScore,
        aiDetectionScore,
        finalScore,
        feedback,
        status: passed ? 'passed' : 'failed',
      })

      if (passed) {
        await this.certificatesService.issueCertificate(userId, courseId, finalScore)
      }
    } catch (error) {
      await this.evaluationRepository.update(evaluationId, {
        status: 'failed',
        feedback: 'Processing error. Please contact support.',
      })

      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Video processing failed for evaluation ${evaluationId}: ${message}`)
      throw error
    } finally {
      await this.redisService.del(CacheKeys.dashboardUser(userId))
    }
  }

  processInBackground(job: VideoProcessingJobData) {
    this.process(job).catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Fallback evaluation processing failed: ${message}`)
    })
  }

  private async loadVideoBuffer(videoKey: string) {
    const s3Response = await this.s3Service.getFile(videoKey)
    const chunks: Buffer[] = []

    for await (const chunk of s3Response.Body as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    return Buffer.concat(chunks)
  }
}
