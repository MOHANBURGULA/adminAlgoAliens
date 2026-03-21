import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './projects.entity'

@Injectable()
export class ProjectsService {

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>
  ) {}

  submitProject(userId: number, data: any) {
    const project = this.projectsRepository.create({ userId, ...data, status: 'pending' })
    return this.projectsRepository.save(project)
  }

  getProjectsByUser(userId: number) {
    return this.projectsRepository.find({ where: { userId } })
  }

}
