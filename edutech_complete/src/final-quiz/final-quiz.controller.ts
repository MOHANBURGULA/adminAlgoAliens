import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common'
import { FinalQuizService } from './final-quiz.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/courses/:courseId/final-quiz')
@UseGuards(JwtAuthGuard)
export class FinalQuizController {

  constructor(private service: FinalQuizService) {}

  // POST /api/courses/1/final-quiz/submit
  @Post('submit')
  submit(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { answers: Record<number, number> }
  ) {
    return this.service.submitFinalQuiz(req.user.id, Number(courseId), body.answers)
  }

  // GET /api/courses/1/final-quiz/attempts
  @Get('attempts')
  getAttempts(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.getAttempts(req.user.id, Number(courseId))
  }

}
