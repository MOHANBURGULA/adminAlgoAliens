import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { FinalQuizService } from './final-quiz.service'

@Controller('api/courses/:courseId/final-quiz')
@UseGuards(JwtAuthGuard)
export class FinalQuizController {
  constructor(private service: FinalQuizService) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'final-quiz:submit', limit: 5, windowSeconds: 300 })
  @Post('submit')
  submit(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { answers: Record<number, number> },
  ) {
    return this.service.submitFinalQuiz(req.user.id, Number(courseId), body.answers)
  }

  @Get('attempts')
  getAttempts(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.getAttempts(req.user.id, Number(courseId))
  }
}
