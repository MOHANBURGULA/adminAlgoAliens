import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { CertificatesModule } from '../certificates/certificates.module'
import { Course } from '../courses/course.entity'
import { EnrollmentsController } from './enrollments.controller'
import { Enrollment } from './enrollment.entity'
import { EnrollmentsService } from './enrollments.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Course]),
    CertificatesModule,
    AuthModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
