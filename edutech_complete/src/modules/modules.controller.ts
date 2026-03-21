import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common'
import { ModulesService } from './modules.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/courses/:courseId/modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {

  constructor(private service: ModulesService) {}

  // GET /api/courses/1/modules
  @Get()
  getModules(@Param('courseId') courseId: string) {
    return this.service.getModulesByCourse(Number(courseId))
  }

  // GET /api/courses/1/modules/2/documents
  @Get(':moduleId/documents')
  getDocuments(@Param('moduleId') moduleId: string) {
    return this.service.getDocumentsByModule(Number(moduleId))
  }

  // GET /api/courses/1/modules/progress
  @Get('progress')
  getProgress(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.getUserCourseProgress(req.user.id, Number(courseId))
  }

}
