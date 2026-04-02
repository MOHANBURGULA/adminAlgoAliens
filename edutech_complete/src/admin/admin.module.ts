import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { User } from '../users/user.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { CourseModule } from '../modules/module.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Question } from '../questions/question.entity'
import { Certificate } from '../certificates/certificate.entity'
import { Project } from '../projects/projects.entity'
import { Video } from '../videos/video.entity'
import { Course } from '../courses/course.entity'
import { CertificatesModule } from '../certificates/certificates.module'
import { S3Module } from '../s3/s3.module'
import { Activity } from '../activity/activity.entity'
import { ActivitySubmission } from '../activity/activity-submission.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Enrollment, Evaluation,
      CourseModule, ModuleDocument, ModuleProgress,
      Question, Certificate, Project, Video, Course,
      Activity, ActivitySubmission,
    ]),
    CertificatesModule,
    S3Module
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
