import { Controller, Get, Query } from '@nestjs/common'
import { S3Service } from './s3.service'

@Controller('api/files')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  // ✅ GET SIGNED URL FOR VIEWING PDF
  @Get('view')
  async getViewUrl(@Query('key') key: string) {
    const url = await this.s3Service.getDownloadUrl(key)
    return { url }
  }
}