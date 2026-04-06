import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { QuizAttemptsService } from './quiz-attempts.service'
import { Type } from 'class-transformer'
import { IsObject } from 'class-validator'

class SubmitQuizDto {
  @IsObject()
  @Type(() => Object)
  answers!: Record<number, number>
}

@Controller('api/courses/:courseId/modules/:moduleId/quiz')
@UseGuards(JwtAuthGuard)
export class QuizAttemptsController {
  constructor(private service: QuizAttemptsService) {}

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'quiz-attempts:submit', limit: 8, windowSeconds: 300 })
  @Post('submit')
  submitQuiz(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: SubmitQuizDto,
  ) {
    return this.service.submitModuleQuiz(req.user.id, courseId, moduleId, body.answers)
  }

  @Get('attempts')
  getAttempts(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.service.getUserAttempts(req.user.id, courseId)
  }
}
