import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../admin/admin.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ActivityService } from './activity.service'
import { CreateActivityDto } from './dto/create-activity.dto'

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ActivityAdminController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('activity')
  createActivity(@Body() dto: CreateActivityDto) {
    return this.activityService.createActivity(dto)
  }
}
