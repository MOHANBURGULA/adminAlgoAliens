import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Question } from './question.entity'
import {
  CACHE_TTL_SECONDS,
  CacheKeys,
  TIMER_TTL_SECONDS,
  TimerKeys,
} from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class QuestionsService {

  constructor(
    @InjectRepository(Question)
    private repo: Repository<Question>,
    private readonly redisService: RedisService,
  ) {}

  // Get module quiz questions — shuffle options but keep track of correct answer
  // Every user gets the same questions but in shuffled order
  async getModuleQuestions(userId: number, courseId: number, moduleId: number) {
    const cacheKey = CacheKeys.moduleQuestions(courseId, moduleId)
    let questions = await this.redisService.getCache<Question[]>(cacheKey)

    if (questions === null) {
      questions = await this.repo.find({ where: { courseId, moduleId, type: 'module' } })
      await this.redisService.setCache(
        cacheKey,
        questions,
        CACHE_TTL_SECONDS.moduleQuestions,
      )
    }

    await this.redisService.setIfAbsent(
      TimerKeys.moduleQuiz(userId, courseId, moduleId),
      new Date().toISOString(),
      TIMER_TTL_SECONDS.moduleQuiz,
    )

    return this.shuffleQuestions(questions)
  }

  // Get final quiz questions for a course
  async getFinalQuizQuestions(userId: number, courseId: number) {
    const cacheKey = CacheKeys.finalQuizQuestions(courseId)
    let questions = await this.redisService.getCache<Question[]>(cacheKey)

    if (questions === null) {
      questions = await this.repo.find({ where: { courseId, type: 'final' } })
      await this.redisService.setCache(
        cacheKey,
        questions,
        CACHE_TTL_SECONDS.finalQuizQuestions,
      )
    }

    await this.redisService.setIfAbsent(
      TimerKeys.finalQuiz(userId, courseId),
      new Date().toISOString(),
      TIMER_TTL_SECONDS.finalQuiz,
    )

    return this.shuffleQuestions(questions)
  }

  // Get questions by IDs (used during answer evaluation)
  getQuestionsByIds(ids: number[]) {
    return this.repo.findBy({ id: In(ids) })
  }

  // Get expected answers for all final quiz questions (used for video evaluation)
  async getExpectedAnswers(courseId: number): Promise<string[]> {
    const questions = await this.repo.find({ where: { courseId, type: 'final' } })
    return questions
      .filter(q => q.expectedAnswer)
      .map(q => q.expectedAnswer)
  }

  // Shuffle the order of questions — same questions, different order per request
  private shuffleQuestions(questions: Question[]) {
    return questions
      .map(q => ({
        id: q.id,
        questionText: q.questionText,
        options: this.shuffleArray([...q.options]),  // shuffle options too
        // NOTE: correctOptionIndex is NOT sent to the frontend
      }))
      .sort(() => Math.random() - 0.5) // shuffle question order
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

}
