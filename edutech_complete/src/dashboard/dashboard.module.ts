import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { Enrollment } from '../enrollments/enrollment.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { Certificate } from '../certificates/certificate.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, ModuleProgress, Evaluation, Certificate])],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
