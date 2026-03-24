import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CertificatesModule } from '../certificates/certificates.module'
import { FinalQuizModule } from '../final-quiz/final-quiz.module'
import { OpenAiModule } from '../openai/openai.module'
import { QuestionsModule } from '../questions/questions.module'
import { S3Module } from '../s3/s3.module'
import { EvaluationController } from './evaluation.controller'
import { Evaluation } from './evaluation.entity'
import { EvaluationService } from './evaluation.service'
import { VideoProcessingProcessor } from './video-processing.processor'
import { VideoProcessingQueueService } from './video-processing.queue'

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation]),
    OpenAiModule,
    QuestionsModule,
    FinalQuizModule,
    CertificatesModule,
    S3Module,
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService, VideoProcessingProcessor, VideoProcessingQueueService],
})
export class EvaluationModule {}
