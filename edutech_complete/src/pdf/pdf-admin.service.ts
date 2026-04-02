import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CourseModule } from '../modules/module.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { CACHE_TTL_SECONDS, CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'
import { S3Service } from '../s3/s3.service'
import { UploadModuleDocumentDto } from './dto/upload-module-document.dto'
import { PdfService } from './pdf.service'

@Injectable()
export class PdfAdminService {
  private readonly logger = new Logger(PdfAdminService.name)

  constructor(
    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,
    @InjectRepository(ModuleDocument)
    private readonly documentRepo: Repository<ModuleDocument>,
    private readonly pdfService: PdfService,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
  ) {}

  async uploadModuleDocument(
    dto: UploadModuleDocumentDto,
    file: Express.Multer.File,
  ) {
    const moduleItem = await this.moduleRepo.findOne({ where: { id: dto.moduleId } })

    if (!moduleItem) {
      throw new NotFoundException('Module not found')
    }

    if (!this.isPdf(file)) {
      throw new BadRequestException('Only PDF files are supported')
    }

    const uploaded = await this.s3Service.uploadFileAtPath(
      'documents',
      file.buffer,
      file.originalname,
      file.mimetype || 'application/pdf',
    )

    let parsedContent: Record<string, unknown> | null = null
    let pageCount: number | null = null
    let parseStatus = 'completed'
    let parseError: string | null = null

    try {
      const parsed = await this.pdfService.parsePdfBuffer(file.buffer, dto.title)
      parsedContent = parsed as unknown as Record<string, unknown>
      pageCount = parsed.pageCount
    } catch (error) {
      parseStatus = 'failed'
      parseError = error instanceof Error ? error.message : 'Unable to parse PDF'
      this.logger.warn(
        `PDF parsing failed for module ${dto.moduleId}: ${parseError}`,
      )
    }

    const document = this.documentRepo.create({
      moduleId: dto.moduleId,
      label: dto.label,
      title: dto.title,
      fileUrl: uploaded.fileUrl,
      storageKey: {
        bucket: process.env.S3_BUCKET || 'algo-aliens',
        key: uploaded.key,
        provider: 'seaweedfs',
      },
      parseStatus,
      parseError,
      pageCount,
      parsedContent,
    })

    const saved = await this.documentRepo.save(document)
    await this.redisService.del(CacheKeys.moduleDocuments(dto.moduleId))

    if (parseStatus === 'completed') {
      await this.redisService.setCache(
        CacheKeys.moduleDocuments(dto.moduleId),
        await this.documentRepo.find({
          where: { moduleId: dto.moduleId },
          order: { createdAt: 'ASC' },
        }),
        CACHE_TTL_SECONDS.moduleDocuments,
      )
    }

    return saved
  }

  private isPdf(file: Express.Multer.File) {
    return (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    )
  }
}
