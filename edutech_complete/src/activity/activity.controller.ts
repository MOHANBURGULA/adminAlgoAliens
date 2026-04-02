import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../admin/admin.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { ActivityService } from './activity.service'
import { CreateActivityDto } from './dto/create-activity.dto'
import { SubmitActivityDto } from './dto/submit-activity.dto'

@Controller('api')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('admin/activity')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createActivity(@Body() dto: CreateActivityDto) {
    return this.activityService.createActivity(dto)
  }

  @Get('activity/course/:courseId/video-eligibility')
  @UseGuards(JwtAuthGuard)
  async getVideoEligibility(
    @Req() req: { user: { id: number } },
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const eligible = await this.activityService.hasQualifiedActivityScore(
      req.user.id,
      courseId,
      60,
    )

    return {
      eligible,
      minimumScore: 60,
    }
  }

  @Get('activity/:moduleId')
  @UseGuards(JwtAuthGuard)
  getActivitiesByModule(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.activityService.getActivitiesByModule(moduleId)
  }

  @Post('activity/submit')
  @UseGuards(JwtAuthGuard, RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'activity:submit', limit: 15, windowSeconds: 300 })
  submitActivity(@Req() req: { user: { id: number } }, @Body() dto: SubmitActivityDto) {
    return this.activityService.submitActivity(req.user.id, dto)
  }
}
