import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Enrollment } from '../enrollments/enrollment.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { Certificate } from '../certificates/certificate.entity'

@Injectable()
export class DashboardService {

  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(ModuleProgress)
    private progressRepo: Repository<ModuleProgress>,

    @InjectRepository(Evaluation)
    private evaluationRepo: Repository<Evaluation>,

    @InjectRepository(Certificate)
    private certificateRepo: Repository<Certificate>
  ) {}

  async getStudentDashboard(userId: number) {
    const [
      enrollments,
      completedModules,
      evaluations,
      certificates
    ] = await Promise.all([
      this.enrollmentRepo.find({ where: { userId } }),
      this.progressRepo.find({ where: { userId, completed: true } }),
      this.evaluationRepo.find({ where: { userId } }),
      this.certificateRepo.find({ where: { userId } })
    ])

    const pendingEvaluations  = evaluations.filter(e => e.status === 'processing' || e.status === 'pending')
    const passedEvaluations   = evaluations.filter(e => e.status === 'passed')
    const failedEvaluations   = evaluations.filter(e => e.status === 'failed')

    return {
      enrolledCourses:      enrollments.length,
      enrollments,
      completedModulesCount: completedModules.length,
      completedModules,
      evaluationSummary: {
        total:    evaluations.length,
        pending:  pendingEvaluations.length,
        passed:   passedEvaluations.length,
        failed:   failedEvaluations.length,
      },
      certificatesEarned: certificates.length,
      certificates
    }
  }

}
