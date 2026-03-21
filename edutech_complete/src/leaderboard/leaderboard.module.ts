import { Module } from '@nestjs/common'
import { LeaderboardController } from './leaderboard.controller'
import { CertificatesModule } from '../certificates/certificates.module'

@Module({
  imports: [CertificatesModule],
  controllers: [LeaderboardController]
})
export class LeaderboardModule {}
