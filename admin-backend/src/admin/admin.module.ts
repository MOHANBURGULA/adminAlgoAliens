import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { User } from '../users/user.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { ModuleActivity } from '../modules/module-activity.entity'
import { CourseModule } from '../modules/module.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Question } from '../questions/question.entity'
import { Certificate } from '../certificates/certificate.entity'
import { Project } from '../projects/projects.entity'
import { Video } from '../videos/video.entity'
import { Course } from '../courses/course.entity'
import { CourseCategory } from '../courses/course-category.entity'
import { CertificatesModule } from '../certificates/certificates.module'
import { S3Module } from '../s3/s3.module'
import { RedisModule } from '../redis/redis.module'
import { CodeExecutionService } from './code-execution.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Enrollment,
      Evaluation,
      CourseModule,
      ModuleActivity,
      ModuleDocument,
      ModuleProgress,
      Question,
      Certificate,
      Project,
      Video,
      Course,
      CourseCategory,
    ]),
    CertificatesModule,
    S3Module,
    RedisModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, CodeExecutionService],
})
export class AdminModule {}
