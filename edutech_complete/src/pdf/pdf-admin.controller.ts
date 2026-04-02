import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AdminGuard } from '../admin/admin.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UploadModuleDocumentDto } from './dto/upload-module-document.dto'
import { PdfAdminService } from './pdf-admin.service'

@Controller('api/admin/modules/documents')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PdfAdminController {
  constructor(private readonly pdfAdminService: PdfAdminService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadModuleDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required')
    }

    return this.pdfAdminService.uploadModuleDocument(body, file)
  }
}
