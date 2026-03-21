import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common'
import { EvaluationService } from './evaluation.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/evaluation')
@UseGuards(JwtAuthGuard)
export class EvaluationController {

  constructor(private service: EvaluationService) {}

  // POST /api/evaluation/submit — first submission
  @Post('submit')
  submit(@Req() req: any, @Body() body: { courseId: number; videoKey: string }) {
    return this.service.startEvaluation(req.user.id, body.courseId, body.videoKey)
  }

  // POST /api/evaluation/:courseId/retry — retry after a failed evaluation
  @Post(':courseId/retry')
  retry(@Req() req: any, @Param('courseId') courseId: string, @Body() body: { videoKey: string }) {
    return this.service.retryEvaluation(req.user.id, Number(courseId), body.videoKey)
  }

  // GET /api/evaluation/:id — poll result
  @Get(':id')
  getStatus(@Req() req: any, @Param('id') id: string) {
    return this.service.getEvaluationStatus(Number(id), req.user.id)
  }

  // GET /api/evaluation/course/:courseId — all evaluations for a course
  @Get('course/:courseId')
  getByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.getByUserAndCourse(req.user.id, Number(courseId))
  }

}
