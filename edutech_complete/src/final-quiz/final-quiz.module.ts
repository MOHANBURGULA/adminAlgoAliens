import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FinalQuizAttempt } from './final-quiz.entity'
import { FinalQuizService } from './final-quiz.service'
import { FinalQuizController } from './final-quiz.controller'
import { QuestionsModule } from '../questions/questions.module'
import { ModulesModule } from '../modules/modules.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([FinalQuizAttempt]),
    QuestionsModule,
    ModulesModule
  ],
  controllers: [FinalQuizController],
  providers: [FinalQuizService],
  exports: [FinalQuizService]
})
export class FinalQuizModule {}
