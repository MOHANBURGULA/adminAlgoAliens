import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {

  constructor(private service: DashboardService) {}

  // GET /api/dashboard — student summary in one call
  @Get()
  getDashboard(@Req() req: any) {
    return this.service.getStudentDashboard(req.user.id)
  }

}
