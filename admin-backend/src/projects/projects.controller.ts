import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { S3Service } from '../s3/s3.service'
import { ProjectsService } from './projects.service'

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private service: ProjectsService,
    private s3Service: S3Service,
  ) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'projects:submit', limit: 5, windowSeconds: 600 })
  @Post()
  @UseInterceptors(FileInterceptor('zipFile'))
  async submitProject(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let zipFileUrl: string | undefined

    if (file) {
      zipFileUrl = await this.s3Service.uploadFile(file.buffer, file.originalname, file.mimetype)
    }

    return this.service.submitProject(req.user.id, {
      courseId: Number(body.courseId),
      githubLink: body.githubLink,
      description: body.description,
      zipFile: zipFileUrl || body.zipFile,
    })
  }

  @Get('upload-url')
  getUploadUrl(@Query('filename') filename: string) {
    return this.s3Service.generateUploadUrl(filename)
  }

  @Get()
  getMyProjects(@Req() req: any) {
    return this.service.getProjectsByUser(req.user.id)
  }
}
