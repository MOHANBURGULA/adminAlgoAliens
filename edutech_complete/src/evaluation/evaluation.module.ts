import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Evaluation } from './evaluation.entity'
import { EvaluationService } from './evaluation.service'
import { EvaluationController } from './evaluation.controller'
import { OpenAiModule } from '../openai/openai.module'
import { QuestionsModule } from '../questions/questions.module'
import { FinalQuizModule } from '../final-quiz/final-quiz.module'
import { CertificatesModule } from '../certificates/certificates.module'
import { S3Module } from '../s3/s3.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation]),
    OpenAiModule,
    QuestionsModule,
    FinalQuizModule,
    CertificatesModule,
    S3Module
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService]
})
export class EvaluationModule {}
