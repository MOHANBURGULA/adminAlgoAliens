import { Controller, Get, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common'
import { ModulesService } from './modules.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/courses/:courseId/modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {

  constructor(private service: ModulesService) {}

  // GET /api/courses/1/modules
  @Get()
  getModules(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.getModulesByCourse(courseId)
  }

  // GET /api/courses/1/modules/2/documents
  @Get(':moduleId/documents')
  getDocuments(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.getDocumentsByModule(moduleId)
  }

  @Get(':moduleId/activities')
  getActivities(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.getActivitiesByModule(moduleId)
  }

  // GET /api/courses/1/modules/progress
  @Get('progress')
  getProgress(@Req() req: any, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.getUserCourseProgress(req.user.id, courseId)
  }

}
