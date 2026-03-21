import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common'
import { QuizAttemptsService } from './quiz-attempts.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/courses/:courseId/modules/:moduleId/quiz')
@UseGuards(JwtAuthGuard)
export class QuizAttemptsController {

  constructor(private service: QuizAttemptsService) {}

  // POST /api/courses/1/modules/2/quiz/submit
  @Post('submit')
  submitQuiz(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: { answers: Record<number, number> }
  ) {
    return this.service.submitModuleQuiz(
      req.user.id,
      Number(courseId),
      Number(moduleId),
      body.answers
    )
  }

  // GET /api/courses/1/modules/2/quiz/attempts
  @Get('attempts')
  getAttempts(
    @Req() req: any,
    @Param('courseId') courseId: string
  ) {
    return this.service.getUserAttempts(req.user.id, Number(courseId))
  }

}
