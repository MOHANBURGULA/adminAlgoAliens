import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FinalQuizAttempt } from './final-quiz.entity'
import { QuestionsService } from '../questions/questions.service'
import { ModulesService } from '../modules/modules.service'
import {
  CACHE_TTL_SECONDS,
  CacheKeys,
  MetricNames,
  TimerKeys,
} from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'
import { RedisService } from '../redis/redis.service'

const FINAL_QUIZ_PASS_THRESHOLD = 80 // 80% required

@Injectable()
export class FinalQuizService {

  constructor(
    @InjectRepository(FinalQuizAttempt)
    private repo: Repository<FinalQuizAttempt>,

    private questionsService: QuestionsService,
    private modulesService: ModulesService,
    private readonly redisService: RedisService,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  async submitFinalQuiz(
    userId: number,
    courseId: number,
    answers: Record<number, number>
  ) {
    // Guard: all modules must be completed first
    const allDone = await this.modulesService.allModulesCompleted(userId, courseId)
    if (!allDone) {
      throw new BadRequestException('You must complete all course modules before taking the final quiz.')
    }

    const questionIds = Object.keys(answers).map(Number)
    const questions = await this.questionsService.getQuestionsByIds(questionIds)

    let correct = 0
    for (const question of questions) {
      if (answers[question.id] === question.correctOptionIndex) {
        correct++
      }
    }

    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= FINAL_QUIZ_PASS_THRESHOLD

    const attempt = this.repo.create({ userId, courseId, answers, score, passed })
    await this.repo.save(attempt)

    await Promise.all([
      this.redisService.del(
        CacheKeys.finalQuizAttemptsUserCourse(userId, courseId),
        TimerKeys.finalQuiz(userId, courseId),
      ),
      this.redisMetricsService.increment(MetricNames.finalQuizSubmitted),
      passed
        ? this.redisMetricsService.increment(MetricNames.finalQuizPassed)
        : Promise.resolve(null),
    ])

    return {
      score,
      passed,
      correct,
      total: questions.length,
      message: passed
        ? `Final quiz passed with ${score}%. You may now record your explanation video.`
        : `Score ${score}% is below the required ${FINAL_QUIZ_PASS_THRESHOLD}%. Please retry.`
    }
  }

  // Check if user has passed the final quiz (needed before video recording)
  async hasPassed(userId: number, courseId: number): Promise<boolean> {
    const attempt = await this.repo.findOne({
      where: { userId, courseId, passed: true }
    })
    return !!attempt
  }

  async getAttempts(userId: number, courseId: number) {
    const cacheKey = CacheKeys.finalQuizAttemptsUserCourse(userId, courseId)
    const cachedAttempts = await this.redisService.getCache<FinalQuizAttempt[]>(cacheKey)
    if (cachedAttempts !== null) {
      return cachedAttempts
    }

    const attempts = await this.repo.find({ where: { userId, courseId } })
    await this.redisService.setCache(
      cacheKey,
      attempts,
      CACHE_TTL_SECONDS.finalQuizAttemptsUserCourse,
    )

    return attempts
  }

}
