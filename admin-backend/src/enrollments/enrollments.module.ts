import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { Course } from '../courses/course.entity'
import { EnrollmentsController } from './enrollments.controller'
import { Enrollment } from './enrollment.entity'
import { EnrollmentsService } from './enrollments.service'

// UPDATED — Change #2: CertificatesModule removed.
// EnrollmentsService no longer auto-issues certificates on progress 100%.
// Certificates are issued exclusively by admin video approval.
@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Course]),
    AuthModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
