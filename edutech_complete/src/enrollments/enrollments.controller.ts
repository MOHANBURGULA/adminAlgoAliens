import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common'
import { EnrollmentsService } from './enrollments.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/enroll')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {

  constructor(private enrollmentsService: EnrollmentsService) {}

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

  // DELETE /api/enroll/:id — unenroll from a course
  @Delete(':id')
  unenroll(@Req() req: any, @Param('id') id: string) {
    return this.enrollmentsService.unenroll(req.user.id, Number(id))
  }

}
