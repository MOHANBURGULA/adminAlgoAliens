import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Evaluation } from './evaluation.entity'
import { OpenAiService } from '../openai/openai.service'
import { QuestionsService } from '../questions/questions.service'
import { FinalQuizService } from '../final-quiz/final-quiz.service'
import { CertificatesService } from '../certificates/certificates.service'
import { S3Service } from '../s3/s3.service'

const CERTIFICATE_SCORE_THRESHOLD = 70

@Injectable()
export class EvaluationService {

  constructor(
    @InjectRepository(Evaluation)
    private repo: Repository<Evaluation>,

    private openAiService: OpenAiService,
    private questionsService: QuestionsService,
    private finalQuizService: FinalQuizService,
    private certificatesService: CertificatesService,
    private s3Service: S3Service
  ) {}

  // Called after frontend uploads video to S3 and sends the key
  async startEvaluation(userId: number, courseId: number, videoKey: string) {

    // Guard: final quiz must be passed first
    const finalPassed = await this.finalQuizService.hasPassed(userId, courseId)
    if (!finalPassed) {
      throw new BadRequestException('You must pass the final quiz (80%) before submitting a video.')
    }

    // Create evaluation record with status 'processing'
    const evaluation = this.repo.create({
      userId, courseId, videoKey, status: 'processing'
    })
    const saved = await this.repo.save(evaluation)

    // Run analysis asynchronously (don't block the HTTP response)
    this.processEvaluation(saved.id, userId, courseId, videoKey).catch(err => {
      console.error('Evaluation processing error:', err)
    })

    return {
      evaluationId: saved.id,
      status: 'processing',
      message: 'Video received. Analysis started. Check status at GET /api/evaluation/:id'
    }
  }

  private async processEvaluation(
    evaluationId: number,
    userId: number,
    courseId: number,
    videoKey: string
  ) {
    try {
      // Step 1: Download video from S3
      const s3Response = await this.s3Service.getFile(videoKey)
      const chunks: Buffer[] = []
      for await (const chunk of s3Response.Body as any) {
        chunks.push(chunk)
      }
      const videoBuffer = Buffer.concat(chunks)

      // Step 2: Transcribe with Whisper
      const transcript = await this.openAiService.transcribeVideo(videoBuffer, `eval-${evaluationId}.mp4`)

      // Step 3: Get expected answers for the course final quiz
      const expectedAnswers = await this.questionsService.getExpectedAnswers(courseId)

      // Step 4: Evaluate transcript with GPT
      const { relevanceScore, aiDetectionScore, finalScore, feedback } =
        await this.openAiService.evaluateTranscript(transcript, expectedAnswers)

      const passed = finalScore >= CERTIFICATE_SCORE_THRESHOLD

      // Step 5: Update evaluation record
      await this.repo.update(evaluationId, {
        transcript,
        relevanceScore,
        aiDetectionScore,
        finalScore,
        feedback,
        status: passed ? 'passed' : 'failed'
      })

      // Step 6: Auto-issue certificate if score >= 70
      if (passed) {
        await this.certificatesService.issueCertificate(userId, courseId, finalScore)
      }

    } catch (error) {
      await this.repo.update(evaluationId, {
        status: 'failed',
        feedback: 'Processing error. Please contact support.'
      })
      throw error
    }
  }

  // Student polls this to check if evaluation is done
  getEvaluationStatus(evaluationId: number, userId: number) {
    return this.repo.findOne({ where: { id: evaluationId, userId } })
  }

  // Get all evaluations for a user in a course
  getByUserAndCourse(userId: number, courseId: number) {
    return this.repo.find({ where: { userId, courseId } })
  }

  // Retry evaluation — only allowed if previous attempt failed
  async retryEvaluation(userId: number, courseId: number, videoKey: string) {
    const lastAttempt = await this.repo.findOne({
      where: { userId, courseId },
      order: { createdAt: 'DESC' }
    })

    if (lastAttempt && lastAttempt.status === 'processing') {
      throw new BadRequestException('Your previous evaluation is still processing. Please wait.')
    }

    if (lastAttempt && lastAttempt.status === 'passed') {
      throw new BadRequestException('You have already passed the evaluation. Certificate has been issued.')
    }

    // Create a new evaluation record and process it
    return this.startEvaluation(userId, courseId, videoKey)
  }

}
