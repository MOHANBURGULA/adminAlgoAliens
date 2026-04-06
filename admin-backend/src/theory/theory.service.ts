import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CourseModule } from '../modules/module.entity'
import { ModulesService } from '../modules/modules.service'
import { S3Service } from '../s3/s3.service'
import { TheoryProgress } from './theory-progress.entity'
import { TheoryResource } from './theory-resource.entity'

type SaveTheoryProgressPayload = {
  bookmarkPage?: number | null
  bookmarkScrollPosition?: number | null
  lastPage?: number | null
  markCompleted?: boolean
  moduleId: number
  percentageCompleted?: number
  scrollPosition?: number
}

@Injectable()
export class TheoryService {
  constructor(
    @InjectRepository(TheoryResource)
    private readonly theoryResourceRepo: Repository<TheoryResource>,

    @InjectRepository(TheoryProgress)
    private readonly theoryProgressRepo: Repository<TheoryProgress>,

    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,

    private readonly modulesService: ModulesService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadTheoryResource(
    moduleId: number,
    title: string,
    file: Express.Multer.File,
  ) {
    if (!Number.isFinite(moduleId) || moduleId < 1) {
      throw new BadRequestException('A valid module ID is required.')
    }

    if (!file) {
      throw new BadRequestException('Upload a PDF or Markdown file first.')
    }

    const moduleItem = await this.moduleRepo.findOne({ where: { id: moduleId } })
    if (!moduleItem) {
      throw new NotFoundException('Module not found')
    }

    const fileType = this.detectFileType(file.originalname, file.mimetype)
    const normalizedTitle = title.trim() || file.originalname.replace(/\.[^.]+$/, '')
    const fileUrl = await this.s3Service.uploadFile(
      file.buffer,
      `theory-${file.originalname}`,
      file.mimetype,
    )

    const resource = this.theoryResourceRepo.create({
      moduleId,
      title: normalizedTitle,
      fileUrl,
      fileType,
    })

    return this.theoryResourceRepo.save(resource)
  }

  async getTheoryByModule(moduleId: number) {
    return this.theoryResourceRepo.findOne({
      where: { moduleId },
      order: { createdAt: 'DESC', id: 'DESC' },
    })
  }

  async saveTheoryProgress(userId: number, payload: SaveTheoryProgressPayload) {
    const moduleItem = await this.moduleRepo.findOne({ where: { id: payload.moduleId } })
    if (!moduleItem) {
      throw new NotFoundException('Module not found')
    }

    const progress = await this.theoryProgressRepo.findOne({
      where: { userId, moduleId: payload.moduleId },
    })

    const percentageCompleted = this.normalizePercentage(payload.percentageCompleted)
    const shouldMarkComplete = Boolean(payload.markCompleted) || Boolean(progress?.completed)

    const nextProgress = this.theoryProgressRepo.create({
      ...(progress || {}),
      userId,
      moduleId: payload.moduleId,
      scrollPosition: this.normalizeFloat(payload.scrollPosition),
      percentageCompleted,
      lastPage: this.normalizeNullableInteger(payload.lastPage),
      bookmarkScrollPosition:
        typeof payload.bookmarkScrollPosition === 'number'
          ? this.normalizeFloat(payload.bookmarkScrollPosition)
          : progress?.bookmarkScrollPosition ?? null,
      bookmarkPage:
        typeof payload.bookmarkPage === 'number'
          ? this.normalizeNullableInteger(payload.bookmarkPage)
          : progress?.bookmarkPage ?? null,
      completed: shouldMarkComplete,
      updatedAt: new Date(),
    })

    const savedProgress = await this.theoryProgressRepo.save(nextProgress)

    if (shouldMarkComplete) {
      await this.modulesService.markModuleComplete(
        userId,
        moduleItem.courseId,
        payload.moduleId,
        100,
      )
    }

    return {
      ...savedProgress,
      unlockedNextStage: shouldMarkComplete,
    }
  }

  async getTheoryProgress(moduleId: number, userId: number, requester: { id: number; role?: string }) {
    if (requester.id !== userId && requester.role !== 'admin') {
      throw new ForbiddenException('You can only view your own theory progress.')
    }

    return this.theoryProgressRepo.findOne({
      where: { moduleId, userId },
    })
  }

  private detectFileType(filename: string, mimeType: string): 'pdf' | 'md' {
    const normalizedName = filename.trim().toLowerCase()
    const normalizedMimeType = mimeType.trim().toLowerCase()

    if (normalizedName.endsWith('.pdf') || normalizedMimeType === 'application/pdf') {
      return 'pdf'
    }

    if (
      normalizedName.endsWith('.md') ||
      normalizedMimeType === 'text/markdown' ||
      normalizedMimeType === 'text/x-markdown' ||
      normalizedMimeType === 'text/plain'
    ) {
      return 'md'
    }

    throw new BadRequestException('Only PDF and Markdown files are supported.')
  }

  private normalizePercentage(value?: number) {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) {
      return 0
    }

    return Math.max(0, Math.min(100, numericValue))
  }

  private normalizeFloat(value?: number) {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) {
      return 0
    }

    return Math.max(0, numericValue)
  }

  private normalizeNullableInteger(value?: number | null) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null
    }

    return Math.max(0, Math.floor(value))
  }
}
