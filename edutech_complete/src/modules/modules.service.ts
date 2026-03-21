import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CourseModule } from './module.entity'
import { ModuleDocument } from './module-document.entity'
import { ModuleProgress } from './module-progress.entity'

@Injectable()
export class ModulesService {

  constructor(
    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,

    @InjectRepository(ModuleDocument)
    private documentRepo: Repository<ModuleDocument>,

    @InjectRepository(ModuleProgress)
    private progressRepo: Repository<ModuleProgress>
  ) {}

  // Get all modules for a course (ordered)
  getModulesByCourse(courseId: number) {
    return this.moduleRepo.find({
      where: { courseId },
      order: { orderIndex: 'ASC' }
    })
  }

  // Get documents (PDFs) for a module
  getDocumentsByModule(moduleId: number) {
    return this.documentRepo.find({ where: { moduleId } })
  }

  // Mark a module as completed for a user (called after passing module quiz)
  async markModuleComplete(userId: number, courseId: number, moduleId: number, quizScore: number) {
    const existing = await this.progressRepo.findOne({ where: { userId, moduleId } })

    if (existing) {
      await this.progressRepo.update(existing.id, {
        completed: true,
        quizScore,
        completedAt: new Date()
      })
      return this.progressRepo.findOne({ where: { id: existing.id } })
    }

    const record = this.progressRepo.create({
      userId, courseId, moduleId,
      completed: true,
      quizScore,
      completedAt: new Date()
    })
    return this.progressRepo.save(record)
  }

  // Get progress for all modules in a course for a user
  getUserCourseProgress(userId: number, courseId: number) {
    return this.progressRepo.find({ where: { userId, courseId } })
  }

  // Check if all 5 modules are completed for a user in a course
  async allModulesCompleted(userId: number, courseId: number): Promise<boolean> {
    const modules = await this.moduleRepo.find({ where: { courseId } })
    const completed = await this.progressRepo.find({ where: { userId, courseId, completed: true } })
    return completed.length >= modules.length && modules.length > 0
  }

}
