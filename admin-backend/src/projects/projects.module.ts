import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Project } from './projects.entity'
import { Course } from '../courses/course.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'
import { S3Module } from '../s3/s3.module'

// UPDATED — Change #8: Course and Enrollment added so ProjectsService can validate them
@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Course, Enrollment]),
    MulterModule.register({ storage: memoryStorage() }),
    S3Module,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
