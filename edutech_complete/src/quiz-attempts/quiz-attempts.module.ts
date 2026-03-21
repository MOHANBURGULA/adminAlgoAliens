import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuizAttempt } from './quiz-attempt.entity'
import { QuizAttemptsService } from './quiz-attempts.service'
import { QuizAttemptsController } from './quiz-attempts.controller'
import { QuestionsModule } from '../questions/questions.module'
import { ModulesModule } from '../modules/modules.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizAttempt]),
    QuestionsModule,
    ModulesModule
  ],
  controllers: [QuizAttemptsController],
  providers: [QuizAttemptsService]
})
export class QuizAttemptsModule {}
