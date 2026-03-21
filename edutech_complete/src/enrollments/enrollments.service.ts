import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Enrollment } from './enrollment.entity'
import { CertificatesService } from '../certificates/certificates.service'

@Injectable()
export class EnrollmentsService {

  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private certificatesService: CertificatesService
  ) {}

  enroll(userId: number, courseId: number) {
    const enrollment = this.enrollmentRepository.create({ userId, courseId, progress: 0 })
    return this.enrollmentRepository.save(enrollment)
  }

  getByUser(userId: number) {
    return this.enrollmentRepository.find({ where: { userId } })
  }

  async updateProgress(enrollmentId: number, progress: number) {
    await this.enrollmentRepository.update(enrollmentId, { progress })
    if (progress >= 100) {
      const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } })
      if (enrollment) {
        await this.certificatesService.issueCertificate(enrollment.userId, enrollment.courseId)
      }
    }
    return this.enrollmentRepository.findOne({ where: { id: enrollmentId } })
  }

  async unenroll(userId: number, enrollmentId: number) {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } })
    if (!enrollment) throw new NotFoundException('Enrollment not found')
    if (enrollment.userId !== userId) throw new ForbiddenException('Not your enrollment')
    await this.enrollmentRepository.delete(enrollmentId)
    return { message: 'Unenrolled successfully' }
  }

}
