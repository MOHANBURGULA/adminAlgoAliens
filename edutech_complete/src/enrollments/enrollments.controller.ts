import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { EnrollmentsService } from './enrollments.service'

@Controller('api/enroll')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'enrollments:create', limit: 10, windowSeconds: 60 })
  @Post()
  enroll(@Req() req: any, @Body() body: any) {
    return this.enrollmentsService.enroll(req.user.id, body.courseId)
  }

  @Get()
  getMyEnrollments(@Req() req: any) {
    return this.enrollmentsService.getByUser(req.user.id)
  }

  @Put(':id/progress')
  updateProgress(@Param('id') id: string, @Body() body: any) {
    return this.enrollmentsService.updateProgress(Number(id), body.progress)
  }

  @Delete(':id')
  unenroll(@Req() req: any, @Param('id') id: string) {
    return this.enrollmentsService.unenroll(req.user.id, Number(id))
  }
}
