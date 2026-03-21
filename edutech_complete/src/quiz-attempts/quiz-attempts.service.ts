import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QuizAttempt } from './quiz-attempt.entity'
import { QuestionsService } from '../questions/questions.service'
import { ModulesService } from '../modules/modules.service'

const MODULE_PASS_THRESHOLD = 60 // 60% to pass a module quiz

@Injectable()
export class QuizAttemptsService {

  constructor(
    @InjectRepository(QuizAttempt)
    private repo: Repository<QuizAttempt>,

    private questionsService: QuestionsService,
    private modulesService: ModulesService
  ) {}

  async submitModuleQuiz(
    userId: number,
    courseId: number,
    moduleId: number,
    answers: Record<number, number>  // { questionId: selectedOptionIndex }
  ) {
    // Fetch the real questions with correct answers from DB
    const questionIds = Object.keys(answers).map(Number)
    const questions = await this.questionsService.getQuestionsByIds(questionIds)

    let correct = 0
    for (const question of questions) {
      if (answers[question.id] === question.correctOptionIndex) {
        correct++
      }
    }

    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= MODULE_PASS_THRESHOLD

    // Save the attempt
    const attempt = this.repo.create({
      userId, courseId, moduleId, answers, score, passed
    })
    await this.repo.save(attempt)

    // If passed, mark module as complete
    if (passed) {
      await this.modulesService.markModuleComplete(userId, courseId, moduleId, score)
    }

    return {
      score,
      passed,
      correct,
      total: questions.length,
      message: passed
        ? `Module passed with ${score}%`
        : `Score ${score}% is below the required ${MODULE_PASS_THRESHOLD}%. Please retry.`
    }
  }

  getUserAttempts(userId: number, courseId: number) {
    return this.repo.find({ where: { userId, courseId } })
  }

}
