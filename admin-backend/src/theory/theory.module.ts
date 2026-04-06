import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CourseModule } from '../modules/module.entity'
import { ModulesModule } from '../modules/modules.module'
import { S3Module } from '../s3/s3.module'
import { TheoryController } from './theory.controller'
import { TheoryProgress } from './theory-progress.entity'
import { TheoryResource } from './theory-resource.entity'
import { TheoryService } from './theory.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([TheoryResource, TheoryProgress, CourseModule]),
    MulterModule.register({ storage: memoryStorage() }),
    S3Module,
    ModulesModule,
  ],
  controllers: [TheoryController],
  providers: [TheoryService],
  exports: [TheoryService],
})
export class TheoryModule {}
