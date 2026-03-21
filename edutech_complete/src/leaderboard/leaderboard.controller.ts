import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CertificatesService } from '../certificates/certificates.service'

@Controller('api/leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {

  constructor(private certificatesService: CertificatesService) {}

  // GET /api/leaderboard/:courseId — top 10 students by score
  @Get(':courseId')
  getLeaderboard(@Param('courseId') courseId: string) {
    return this.certificatesService.getLeaderboard(Number(courseId))
  }

}
