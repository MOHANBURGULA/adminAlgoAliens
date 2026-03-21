import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Project } from './projects.entity'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'
import { S3Module } from '../s3/s3.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    MulterModule.register({ storage: memoryStorage() }),
    S3Module
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService]
})
export class ProjectsModule {}
