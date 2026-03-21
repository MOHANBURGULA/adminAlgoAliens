import {
  Controller, Post, Get, Body, Query,
  UploadedFile, UseGuards, UseInterceptors, Req
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ProjectsService } from './projects.service'
import { S3Service } from '../s3/s3.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {

  constructor(
    private service: ProjectsService,
    private s3Service: S3Service
  ) {}

  // Option A: Backend upload — send ZIP as multipart/form-data
  @Post()
  @UseInterceptors(FileInterceptor('zipFile'))
  async submitProject(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let zipFileUrl: string | undefined

    if (file) {
      zipFileUrl = await this.s3Service.uploadFile(file.buffer, file.originalname, file.mimetype)
    }

    return this.service.submitProject(req.user.id, {
      courseId: Number(body.courseId),
      githubLink: body.githubLink,
      description: body.description,
      zipFile: zipFileUrl || body.zipFile
    })
  }

  // Option B: Get a presigned URL so frontend uploads directly to S3
  // Usage: GET /api/projects/upload-url?filename=myproject.zip
  @Get('upload-url')
  getUploadUrl(@Query('filename') filename: string) {
    return this.s3Service.generateUploadUrl(filename)
  }

  // Get all projects submitted by the logged-in user
  @Get()
  getMyProjects(@Req() req: any) {
    return this.service.getProjectsByUser(req.user.id)
  }

}
