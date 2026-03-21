import { Controller, Get, Param } from '@nestjs/common'
import { CoursesService } from './courses.service'

@Controller('api/courses')
export class CoursesController {

  constructor(private service: CoursesService) {}

  @Get()
  getCourses() {
    return this.service.getCourses()
  }

  @Get(':id')
  getCourseById(@Param('id') id: string) {
    return this.service.getCourseById(Number(id))
  }

}
