import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { CourseModule } from '../modules/module.entity'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'
import { Judge0Service } from '../execution/judge0.service'
import { ActivitySubmission } from './activity-submission.entity'
import { Activity } from './activity.entity'
import { CreateActivityDto } from './dto/create-activity.dto'
import { SubmitActivityDto } from './dto/submit-activity.dto'
import { ActivityType } from './activity-type.enum'

type StoredActivityContent = {
  choices?: Array<{ label: string }>
  correctChoiceIndex?: number
  description: string
  expectedOutput?: string
  explanation?: string
  language?: string
  sqlSchema?: string
  starterCode?: string
  testCases?: Array<{
    input?: string
    isHidden?: boolean
    output?: string
  }>
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name)

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivitySubmission)
    private readonly submissionRepo: Repository<ActivitySubmission>,
    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,
    private readonly redisService: RedisService,
    private readonly judge0Service: Judge0Service,
  ) {}

  async createActivity(dto: CreateActivityDto) {
    await this.ensureModuleExists(dto.moduleId)
    this.validateContent(dto.activityType, dto.content as StoredActivityContent)
    const content = JSON.parse(
      JSON.stringify(dto.content),
    ) as Record<string, unknown>

    const activity = this.activityRepo.create({
      activityType: dto.activityType,
      content,
      moduleId: dto.moduleId,
    })

    const saved = await this.activityRepo.save(activity)
    await this.redisService.del(CacheKeys.moduleActivities(dto.moduleId))
    return saved
  }

  async getActivitiesByModule(moduleId: number) {
    await this.ensureModuleExists(moduleId)

    const cacheKey = CacheKeys.moduleActivities(moduleId)
    const cached = await this.redisService.getCache<Activity[]>(cacheKey)
    if (cached !== null) {
      return cached
    }

    const activities = await this.activityRepo.find({
      where: { moduleId },
      order: { createdAt: 'ASC' },
    })

    await this.redisService.setCache(
      cacheKey,
      activities,
      CACHE_TTL_SECONDS.moduleActivities,
    )

    return activities
  }

  async submitActivity(userId: number, dto: SubmitActivityDto) {
    const activity = await this.activityRepo.findOne({ where: { id: dto.activityId } })

    if (!activity) {
      throw new NotFoundException('Activity not found')
    }

    const content = activity.content as StoredActivityContent
    let answerPayload: Record<string, unknown>
    let resultPayload: Record<string, unknown>

    switch (activity.activityType) {
      case ActivityType.SQL_DEBUGGING:
      case ActivityType.CODE_SNIPPET: {
        const sourceCode = dto.sourceCode?.trim() || content.starterCode?.trim()

        if (!sourceCode) {
          throw new BadRequestException('Source code is required')
        }

        const execution = await this.judge0Service.executeActivity({
          activityType: activity.activityType,
          expectedOutput: content.expectedOutput,
          language: dto.language || content.language,
          sourceCode,
          sqlSchema: content.sqlSchema,
          testCases: content.testCases,
        })

        answerPayload = {
          language: dto.language || content.language || null,
          sourceCode,
        }
        resultPayload = execution
        break
      }

      case ActivityType.ANALYSIS: {
        const answer = dto.answer?.trim()

        if (!answer) {
          throw new BadRequestException('Answer is required')
        }

        const evaluation = this.evaluateAnalysis(content.explanation || '', answer)
        answerPayload = { answer }
        resultPayload = evaluation
        break
      }

      case ActivityType.QUIZ: {
        if (typeof dto.selectedOptionIndex !== 'number') {
          throw new BadRequestException('Selected option is required')
        }

        const correctChoiceIndex = content.correctChoiceIndex
        const choices = content.choices || []

        if (
          typeof correctChoiceIndex !== 'number' ||
          choices.length === 0 ||
          dto.selectedOptionIndex >= choices.length
        ) {
          throw new BadRequestException('Quiz activity is not configured correctly')
        }

        const isCorrect = dto.selectedOptionIndex === correctChoiceIndex

        answerPayload = {
          selectedOptionIndex: dto.selectedOptionIndex,
        }
        resultPayload = {
          correct: isCorrect,
          correctOptionIndex: correctChoiceIndex,
          explanation: content.explanation || '',
          score: isCorrect ? 100 : 0,
        }
        break
      }

      default:
        throw new BadRequestException('Invalid activity type')
    }

    const submission = this.submissionRepo.create({
      activityId: activity.id,
      answer: answerPayload,
      moduleId: activity.moduleId,
      result: resultPayload,
      status: 'evaluated',
      userId,
    })

    const savedSubmission = await this.submissionRepo.save(submission)

    return {
      activityId: activity.id,
      activityType: activity.activityType,
      submissionId: savedSubmission.id,
      result: resultPayload,
    }
  }

  async hasQualifiedActivityScore(userId: number, courseId: number, minimumScore = 60) {
    const modules = await this.moduleRepo.find({
      where: { courseId },
      select: ['id'],
    })

    if (modules.length === 0) {
      return false
    }

    const activities = await this.activityRepo.find({
      where: { moduleId: In(modules.map((moduleItem) => moduleItem.id)) },
      select: ['id'],
    })

    if (activities.length === 0) {
      return false
    }

    const submissions = await this.submissionRepo.find({
      where: {
        activityId: In(activities.map((activity) => activity.id)),
        userId,
      },
      order: { createdAt: 'DESC' },
    })

    return submissions.some((submission) => this.extractScore(submission.result) >= minimumScore)
  }

  private async ensureModuleExists(moduleId: number) {
    const moduleItem = await this.moduleRepo.findOne({ where: { id: moduleId } })
    if (!moduleItem) {
      throw new NotFoundException('Module not found')
    }
  }

  private validateContent(activityType: ActivityType, content: StoredActivityContent) {
    if (!content.description?.trim()) {
      throw new BadRequestException('Activity description is required')
    }

    if (activityType === ActivityType.SQL_DEBUGGING && !content.sqlSchema?.trim()) {
      throw new BadRequestException('SQL schema is required for SQL debugging activities')
    }

    if (
      activityType === ActivityType.QUIZ &&
      (!content.choices?.length ||
        typeof content.correctChoiceIndex !== 'number' ||
        content.correctChoiceIndex < 0 ||
        content.correctChoiceIndex >= content.choices.length)
    ) {
      throw new BadRequestException('Quiz activities require options and a valid correct answer')
    }

    if (
      activityType === ActivityType.ANALYSIS &&
      !content.explanation?.trim()
    ) {
      throw new BadRequestException('Analysis activities require a reference explanation')
    }

    if (
      (activityType === ActivityType.CODE_SNIPPET ||
        activityType === ActivityType.SQL_DEBUGGING) &&
      !content.starterCode?.trim()
    ) {
      throw new BadRequestException('Starter code is required for executable activities')
    }
  }

  private evaluateAnalysis(reference: string, answer: string) {
    const keywords = Array.from(
      new Set(
        reference
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 5),
      ),
    ).slice(0, 12)

    const normalizedAnswer = answer.toLowerCase()
    const matchedKeywords = keywords.filter((keyword) =>
      normalizedAnswer.includes(keyword),
    )
    const score = keywords.length
      ? Math.round((matchedKeywords.length / keywords.length) * 100)
      : 0

    return {
      accepted: score >= 40,
      feedback:
        score >= 40
          ? 'Your answer covers the key ideas well.'
          : 'Your answer needs more detail. Review the explanation and try again.',
      matchedKeywords,
      score,
    }
  }

  private extractScore(result: Record<string, unknown>) {
    const rawScore = result.score
    if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
      return rawScore
    }

    if (
      result.passed === true ||
      result.correct === true ||
      result.accepted === true
    ) {
      return 100
    }

    return 0
  }
}
