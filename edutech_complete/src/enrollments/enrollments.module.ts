import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Enrollment } from './enrollment.entity'
import { EnrollmentsService } from './enrollments.service'
import { EnrollmentsController } from './enrollments.controller'
import { CertificatesModule } from '../certificates/certificates.module'
import { AuthModule } from '../auth/auth.module'   // ← ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment]),
    CertificatesModule,
    AuthModule   // ← ADD THIS
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService]
})
export class EnrollmentsModule {}
