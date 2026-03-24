import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { QuizAttemptsService } from './quiz-attempts.service'

@Controller('api/courses/:courseId/modules/:moduleId/quiz')
@UseGuards(JwtAuthGuard)
export class QuizAttemptsController {
  constructor(private service: QuizAttemptsService) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'quiz-attempts:submit', limit: 8, windowSeconds: 300 })
  @Post('submit')
  submitQuiz(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: { answers: Record<number, number> },
  ) {
    return this.service.submitModuleQuiz(
      req.user.id,
      Number(courseId),
      Number(moduleId),
      body.answers,
    )
  }

  @Get('attempts')
  getAttempts(
    @Req() req: any,
    @Param('courseId') courseId: string,
  ) {
    return this.service.getUserAttempts(req.user.id, Number(courseId))
  }
}
