import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { CoursesService } from './courses.service'

@Controller('api/courses')
export class CoursesController {

  constructor(private service: CoursesService) {}

  // Change #12 — accepts optional ?keyword=sql for search
  @Get()
  getCourses(@Query('keyword') keyword?: string) {
    if (keyword && keyword.trim()) {
      return this.service.searchByKeyword(keyword)
    }
    return this.service.getCourses()
  }

  @Get(':id')
  getCourseById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCourseById(id)
  }

}
