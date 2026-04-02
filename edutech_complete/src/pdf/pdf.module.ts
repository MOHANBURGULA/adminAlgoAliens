import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CourseModule } from '../modules/module.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { S3Module } from '../s3/s3.module'
import { PdfAdminController } from './pdf-admin.controller'
import { PdfAdminService } from './pdf-admin.service'
import { PdfService } from './pdf.service'

@Module({
  imports: [TypeOrmModule.forFeature([CourseModule, ModuleDocument]), S3Module],
  controllers: [PdfAdminController],
  providers: [PdfService, PdfAdminService],
  exports: [PdfService, PdfAdminService],
})
export class PdfModule {}
