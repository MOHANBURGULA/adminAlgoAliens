import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Course } from './course.entity'
import { CourseCategory } from './course-category.entity'
import { CoursesController } from './courses.controller'
import { CoursesService } from './courses.service'

// UPDATED — Change #11: CourseCategory registered here
@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseCategory])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule {}
