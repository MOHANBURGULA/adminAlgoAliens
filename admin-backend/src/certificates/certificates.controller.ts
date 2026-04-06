import { Controller, Get, Param, UseGuards, Req, NotFoundException } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/certificates')
export class CertificatesController {

  constructor(private service: CertificatesService) {}

  // GET /api/certificates — all my certificates (JWT required)
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyCertificates(@Req() req: any) {
    return this.service.getCertificatesByUser(req.user.id)
  }

  // GET /api/certificates/:id — single certificate (JWT required)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getCertificateById(@Req() req: any, @Param('id') id: string) {
    const cert = await this.service.getCertificateById(Number(id), req.user.id)
    if (!cert) throw new NotFoundException('Certificate not found')
    return cert
  }

  // GET /api/certificates/:id/verify — PUBLIC, no login needed
  @Get(':id/verify')
  verifyCertificate(@Param('id') id: string) {
    return this.service.verifyCertificate(Number(id))
  }

}
