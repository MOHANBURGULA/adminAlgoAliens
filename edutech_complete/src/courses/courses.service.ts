import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Course } from './course.entity'

@Injectable()
export class CoursesService {

  constructor(
    @InjectRepository(Course)
    private repo: Repository<Course>
  ) {}

  getCourses() {
    return this.repo.find()
  }

  getCourseById(id: number) {
    return this.repo.findOne({ where: { id } })
  }

}
