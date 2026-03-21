import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api')
@UseGuards(JwtAuthGuard)
export class QuestionsController {

  constructor(private service: QuestionsService) {}

  // GET /api/courses/1/modules/2/questions  (module quiz)
  @Get('courses/:courseId/modules/:moduleId/questions')
  getModuleQuestions(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string
  ) {
    return this.service.getModuleQuestions(Number(courseId), Number(moduleId))
  }

  // GET /api/courses/1/final-quiz/questions  (final quiz)
  @Get('courses/:courseId/final-quiz/questions')
  getFinalQuizQuestions(@Param('courseId') courseId: string) {
    return this.service.getFinalQuizQuestions(Number(courseId))
  }

}
