import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FinalQuizModule } from '../final-quiz/final-quiz.module'
import { OpenAiModule } from '../openai/openai.module'
import { QuestionsModule } from '../questions/questions.module'
import { S3Module } from '../s3/s3.module'
import { Evaluation } from './evaluation.entity'
import { EvaluationService } from './evaluation.service'
import { VideoProcessingProcessor } from './video-processing.processor'
import { VideoProcessingQueueService } from './video-processing.queue'
import { CertificatesModule } from '../certificates/certificates.module';
// UPDATED — Change #2: CertificatesModule removed (no auto-certificate issuance)
// UPDATED — Change #13: EvaluationController removed (user-facing routes removed)
//           Admin still accesses evaluations via GET /api/admin/evaluations
@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation]),
    OpenAiModule,
    QuestionsModule,
    FinalQuizModule,
    S3Module,
    CertificatesModule,   // ✅ ADD THIS LINE
  ],
  providers: [
    EvaluationService,
    VideoProcessingProcessor,
    VideoProcessingQueueService
  ],
  exports: [EvaluationService],
})
export class EvaluationModule {}