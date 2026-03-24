import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api')
@UseGuards(JwtAuthGuard)
export class QuestionsController {

  constructor(private service: QuestionsService) {}

  // GET /api/courses/1/modules/2/questions  (module quiz)
  @Get('courses/:courseId/modules/:moduleId/questions')
  getModuleQuestions(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string
  ) {
    return this.service.getModuleQuestions(req.user.id, Number(courseId), Number(moduleId))
  }

  // GET /api/courses/1/final-quiz/questions  (final quiz)
  @Get('courses/:courseId/final-quiz/questions')
  getFinalQuizQuestions(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.getFinalQuizQuestions(req.user.id, Number(courseId))
  }

}
