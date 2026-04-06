import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Certificate } from './certificate.entity'

@Injectable()
export class CertificatesService {

  constructor(
    @InjectRepository(Certificate)
    private repo: Repository<Certificate>
  ) {}

  getCertificatesByUser(userId: number) {
    return this.repo.find({ where: { userId } })
  }

  getCertificateById(id: number, userId: number) {
    return this.repo.findOne({ where: { id, userId } })
  }

  // Public verify — anyone can check if a certificate is genuine
  async verifyCertificate(id: number) {
    const cert = await this.repo.findOne({ where: { id } })
    if (!cert) return { valid: false, message: 'Certificate not found' }
    return {
      valid: true,
      certificateId: cert.id,
      userId:        cert.userId,
      courseId:      cert.courseId,
      score:         cert.score,
      issuedAt:      cert.issuedAt
    }
  }

  async issueCertificate(userId: number, courseId: number, score: number = 100) {
    const existing = await this.repo.findOne({ where: { userId, courseId } })
    if (existing) return existing
    const certificate = this.repo.create({ userId, courseId, score })
    return this.repo.save(certificate)
  }

  async manuallyIssueCertificate(userId: number, courseId: number) {
    return this.issueCertificate(userId, courseId, 100)
  }

  getAllCertificates() {
    return this.repo.find()
  }

  // Leaderboard — top students for a course ranked by score
  getLeaderboard(courseId: number) {
    return this.repo.find({
      where: { courseId },
      order: { score: 'DESC' },
      take: 10
    })
  }

}
