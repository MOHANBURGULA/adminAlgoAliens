import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { EvaluationService } from './evaluation.service'

@Controller('api/evaluation')
@UseGuards(JwtAuthGuard)
export class EvaluationController {
  constructor(private service: EvaluationService) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'evaluation:submit', limit: 3, windowSeconds: 600 })
  @Post('submit')
  submit(@Req() req: any, @Body() body: { courseId: number; videoKey: string }) {
    return this.service.startEvaluation(req.user.id, body.courseId, body.videoKey)
  }

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'evaluation:retry', limit: 3, windowSeconds: 600 })
  @Post(':courseId/retry')
  retry(@Req() req: any, @Param('courseId') courseId: string, @Body() body: { videoKey: string }) {
    return this.service.retryEvaluation(req.user.id, Number(courseId), body.videoKey)
  }

  @Get(':id')
  getStatus(@Req() req: any, @Param('id') id: string) {
    return this.service.getEvaluationStatus(Number(id), req.user.id)
  }

  @Get('course/:courseId')
  getByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.getByUserAndCourse(req.user.id, Number(courseId))
  }
}
