import {
  Controller, Post, Get, Body, Query,
  UploadedFile, UseGuards, UseInterceptors, Req
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { VideosService } from './videos.service'
import { S3Service } from '../s3/s3.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/videos')
@UseGuards(JwtAuthGuard)
export class VideosController {

  constructor(
    private service: VideosService,
    private s3Service: S3Service
  ) {}

  // Option A: Upload video file directly through backend
  @Post()
  @UseInterceptors(FileInterceptor('videoFile'))
  async uploadVideo(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let videoUrl = body.videoUrl

    if (file) {
      videoUrl = await this.s3Service.uploadFile(file.buffer, file.originalname, file.mimetype)
    }

    return this.service.upload(req.user.id, {
      title: body.title,
      description: body.description,
      videoUrl
    })
  }

  // Option B: Get presigned URL for direct frontend upload
  // Usage: GET /api/videos/upload-url?filename=myvideo.mp4
  @Get('upload-url')
  getUploadUrl(@Query('filename') filename: string) {
    return this.s3Service.generateUploadUrl(filename)
  }

  // Get all videos uploaded by the logged-in user
  @Get()
  getMyVideos(@Req() req: any) {
    return this.service.getUserVideos(req.user.id)
  }

}
