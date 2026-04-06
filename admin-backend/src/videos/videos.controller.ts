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
import { VideosService } from './videos.service'

@Controller('api/videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(
    private service: VideosService,
    private s3Service: S3Service,
  ) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'videos:submit', limit: 5, windowSeconds: 600 })
  @Post()
  @UseInterceptors(FileInterceptor('videoFile'))
  async uploadVideo(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let videoUrl = body.videoUrl

    if (file) {
      videoUrl = await this.s3Service.uploadFile(file.buffer, file.originalname, file.mimetype)
    }

    return this.service.upload(req.user.id, {
      title: body.title,
      description: body.description,
      videoUrl,
      // Change #4 — courseId stored so admin approval can trigger certificate issuance
      courseId: body.courseId ? Number(body.courseId) : null,
    })
  }

  @Get('upload-url')
  getUploadUrl(@Query('filename') filename: string) {
    return this.s3Service.generateUploadUrl(filename)
  }

  // Change #14 — returns status label, feedback, rejectionCount, attemptsRemaining
  @Get()
  getMyVideos(@Req() req: any) {
    return this.service.getUserVideos(req.user.id)
  }
}
