import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { CourseModule } from '../modules/module.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Question } from '../questions/question.entity'
import { Certificate } from '../certificates/certificate.entity'
import { Project } from '../projects/projects.entity'
import { Video } from '../videos/video.entity'
import { Course } from '../courses/course.entity'
import { CertificatesService } from '../certificates/certificates.service'
import { S3Service } from '../s3/s3.service'
import { CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class AdminService {

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Evaluation)
    private evaluationRepo: Repository<Evaluation>,

    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,

    @InjectRepository(ModuleDocument)
    private documentRepo: Repository<ModuleDocument>,

    @InjectRepository(ModuleProgress)
    private progressRepo: Repository<ModuleProgress>,

    @InjectRepository(Question)
    private questionRepo: Repository<Question>,

    @InjectRepository(Certificate)
    private certificateRepo: Repository<Certificate>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(Video)
    private videoRepo: Repository<Video>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,

    private certificatesService: CertificatesService,
    private s3Service: S3Service,
    private readonly redisService: RedisService,
  ) {}

  // ── USER MANAGEMENT ─────────────────────────────────────────

  getAllUsers() {
    return this.userRepo.find({ select: ['id', 'name', 'email', 'role', 'createdAt'] })
  }

  async getUserById(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt']
    })
    if (!user) return null

    const [enrollments, evaluations, certificates] = await Promise.all([
      this.enrollmentRepo.find({ where: { userId } }),
      this.evaluationRepo.find({ where: { userId } }),
      this.certificateRepo.find({ where: { userId } }),
    ])

    return { ...user, enrollments, evaluations, certificates }
  }

  // Change a user's role (student ↔ admin)
  async changeUserRole(userId: number, role: string) {
    await this.userRepo.update(userId, { role })
    return this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role']
    })
  }

  // ── ADMIN DASHBOARD ─────────────────────────────────────────

  async getAdminDashboard() {
    const [
      totalUsers,
      totalEnrollments,
      totalCertificates,
      pendingEvaluations,
      pendingProjects,
      pendingVideos,
      allCourses
    ] = await Promise.all([
      this.userRepo.count({ where: { role: 'student' } }),
      this.enrollmentRepo.count(),
      this.certificateRepo.count(),
      this.evaluationRepo.count({ where: { status: 'processing' } }),
      this.projectRepo.count({ where: { status: 'pending' } }),
      this.videoRepo.count({ where: { status: 'under_review' } }),
      this.courseRepo.find()
    ])

    return {
      totalStudents:       totalUsers,
      totalEnrollments,
      totalCertificates,
      pendingEvaluations,
      pendingProjects,
      pendingVideos,
      totalCourses:        allCourses.length,
    }
  }

  // ── PROGRESS MONITORING ──────────────────────────────────────

  getAllEnrollments() {
    return this.enrollmentRepo.find()
  }

  getUserEnrollments(userId: number) {
    return this.enrollmentRepo.find({ where: { userId } })
  }

  getAllEvaluations() {
    return this.evaluationRepo.find()
  }

  getUserEvaluations(userId: number) {
    return this.evaluationRepo.find({ where: { userId } })
  }

  getAllCertificates() {
    return this.certificatesService.getAllCertificates()
  }

  // All students' progress in a specific course
  async getCourseProgress(courseId: number) {
    const enrollments = await this.enrollmentRepo.find({ where: { courseId } })
    const results = await Promise.all(
      enrollments.map(async (e) => {
        const completedModules = await this.progressRepo.find({
          where: { userId: e.userId, courseId, completed: true }
        })
        const evaluation = await this.evaluationRepo.findOne({
          where: { userId: e.userId, courseId }
        })
        const certificate = await this.certificateRepo.findOne({
          where: { userId: e.userId, courseId }
        })
        return {
          userId:           e.userId,
          enrollmentId:     e.id,
          progress:         e.progress,
          modulesCompleted: completedModules.length,
          quizScores:       completedModules.map(m => ({ moduleId: m.moduleId, score: m.quizScore })),
          evaluation:       evaluation ? { status: evaluation.status, finalScore: evaluation.finalScore } : null,
          certificate:      certificate ? { id: certificate.id, score: certificate.score } : null,
        }
      })
    )
    return results
  }

  // ── CERTIFICATE MANAGEMENT ───────────────────────────────────

  manuallyReleaseCertificate(userId: number, courseId: number) {
    return this.certificatesService.manuallyIssueCertificate(userId, courseId)
  }

  // ── PROJECT MANAGEMENT ───────────────────────────────────────

  getAllProjects() {
    return this.projectRepo.find()
  }

  async updateProjectStatus(id: number, status: string, feedback?: string) {
    const updateData: any = { status }
    if (feedback) updateData.feedback = feedback
    await this.projectRepo.update(id, updateData)
    const updated = await this.projectRepo.findOne({ where: { id } })
    if (!updated) return { message: 'Updated successfully', id, status, feedback }
    return updated
  }

  // ── VIDEO MANAGEMENT ─────────────────────────────────────────

  getAllVideos() {
    return this.videoRepo.find()
  }

  async updateVideoStatus(id: number, status: string) {
    await this.videoRepo.update(id, { status })
    return this.videoRepo.findOne({ where: { id } })
  }

  // ── MODULE MANAGEMENT ────────────────────────────────────────

  async createModule(data: { courseId: number; title: string; orderIndex: number }) {
    const module = this.moduleRepo.create(data)
    const savedModule = await this.moduleRepo.save(module)
    await this.redisService.del(CacheKeys.modulesCourse(savedModule.courseId))
    return savedModule
  }

  async updateModule(id: number, data: { title?: string; orderIndex?: number }) {
    const existingModule = await this.moduleRepo.findOne({ where: { id } })
    await this.moduleRepo.update(id, data)
    const updatedModule = await this.moduleRepo.findOne({ where: { id } })

    const courseIds = new Set<number>()
    if (existingModule) {
      courseIds.add(existingModule.courseId)
    }
    if (updatedModule) {
      courseIds.add(updatedModule.courseId)
    }

    await this.redisService.del(
      ...Array.from(courseIds).map((courseId) => CacheKeys.modulesCourse(courseId)),
    )

    return updatedModule
  }

  async deleteModule(id: number) {
    const existingModule = await this.moduleRepo.findOne({ where: { id } })
    await this.documentRepo.delete({ moduleId: id })
    const result = await this.moduleRepo.delete(id)

    await this.redisService.del(
      CacheKeys.moduleDocuments(id),
      ...(existingModule ? [CacheKeys.moduleQuestions(existingModule.courseId, id)] : []),
      ...(existingModule ? [CacheKeys.modulesCourse(existingModule.courseId)] : []),
    )

    return result
  }

  async createModuleDocument(data: { moduleId: number; label: string; title: string; fileUrl: string }) {
    const doc = this.documentRepo.create(data)
    const savedDocument = await this.documentRepo.save(doc)
    await this.redisService.del(CacheKeys.moduleDocuments(savedDocument.moduleId))
    return savedDocument
  }

  async updateModuleDocument(id: number, data: { label?: string; title?: string; fileUrl?: string }) {
    const existingDocument = await this.documentRepo.findOne({ where: { id } })
    await this.documentRepo.update(id, data)
    const updatedDocument = await this.documentRepo.findOne({ where: { id } })

    const moduleIds = new Set<number>()
    if (existingDocument) {
      moduleIds.add(existingDocument.moduleId)
    }
    if (updatedDocument) {
      moduleIds.add(updatedDocument.moduleId)
    }

    await this.redisService.del(
      ...Array.from(moduleIds).map((moduleId) => CacheKeys.moduleDocuments(moduleId)),
    )

    return updatedDocument
  }

  async deleteModuleDocument(id: number) {
    const existingDocument = await this.documentRepo.findOne({ where: { id } })
    const result = await this.documentRepo.delete(id)

    if (existingDocument) {
      await this.redisService.del(CacheKeys.moduleDocuments(existingDocument.moduleId))
    }

    return result
  }

  getDocumentUploadUrl(filename: string) {
    return this.s3Service.generateUploadUrl(`documents/${filename}`)
  }

  // ── QUESTION MANAGEMENT ──────────────────────────────────────

  async createQuestion(data: any) {
    const question = this.questionRepo.create(data)
    const savedQuestion = await this.questionRepo.save(question)
    const normalizedQuestion = Array.isArray(savedQuestion) ? savedQuestion[0] : savedQuestion

    await this.invalidateQuestionCaches(
      normalizedQuestion?.courseId,
      normalizedQuestion?.moduleId,
      normalizedQuestion?.type,
    )

    return normalizedQuestion
  }

  getCourseQuestions(courseId: number) {
    return this.questionRepo.find({ where: { courseId } })
  }

  async updateQuestion(id: number, data: Partial<Question>) {
    const existingQuestion = await this.questionRepo.findOne({ where: { id } })
    await this.questionRepo.update(id, data)
    const updatedQuestion = await this.questionRepo.findOne({ where: { id } })

    await this.invalidateQuestionCaches(
      existingQuestion?.courseId,
      existingQuestion?.moduleId,
      existingQuestion?.type,
    )
    await this.invalidateQuestionCaches(
      updatedQuestion?.courseId,
      updatedQuestion?.moduleId,
      updatedQuestion?.type,
    )

    return updatedQuestion
  }

  async deleteQuestion(id: number) {
    const existingQuestion = await this.questionRepo.findOne({ where: { id } })
    const result = await this.questionRepo.delete(id)

    await this.invalidateQuestionCaches(
      existingQuestion?.courseId,
      existingQuestion?.moduleId,
      existingQuestion?.type,
    )

    return result
  }

  // ── COURSE MANAGEMENT ────────────────────────────────────────

  async getAllCoursesWithStats() {
    const courses = await this.courseRepo.find()
    return Promise.all(courses.map(async (c) => {
      const [moduleCount, enrollmentCount, certificateCount] = await Promise.all([
        this.moduleRepo.count({ where: { courseId: c.id } }),
        this.enrollmentRepo.count({ where: { courseId: c.id } }),
        this.certificateRepo.count({ where: { courseId: c.id } }),
      ])
      return { ...c, moduleCount, enrollmentCount, certificateCount }
    }))
  }

  async createCourse(data: { title: string; difficulty: string }) {
    const course = this.courseRepo.create(data)
    const savedCourse = await this.courseRepo.save(course)
    await this.redisService.del(CacheKeys.coursesAll())
    return savedCourse
  }

  async updateCourse(id: number, data: { title?: string; difficulty?: string }) {
    await this.courseRepo.update(id, data)
    const updatedCourse = await this.courseRepo.findOne({ where: { id } })
    await this.invalidateCourseCaches(id)
    return updatedCourse
  }

  async deleteCourse(id: number) {
    const course = await this.courseRepo.findOne({ where: { id } })

    if (!course) {
      throw new NotFoundException('Course not found')
    }

    const enrollmentCount = await this.enrollmentRepo.count({ where: { courseId: id } })

    if (enrollmentCount > 0) {
      throw new BadRequestException('Cannot delete course with enrollments')
    }

    const modules = await this.moduleRepo.find({ where: { courseId: id } })
    const moduleIds = modules.map((module) => module.id)

    if (moduleIds.length > 0) {
      await this.documentRepo.delete({ moduleId: In(moduleIds) })
    }

    await Promise.all([
      this.moduleRepo.delete({ courseId: id }),
      this.progressRepo.delete({ courseId: id }),
      this.questionRepo.delete({ courseId: id }),
      this.evaluationRepo.delete({ courseId: id }),
      this.certificateRepo.delete({ courseId: id }),
      this.projectRepo.delete({ courseId: id }),
    ])

    await this.courseRepo.remove(course)

    await this.redisService.del(
      CacheKeys.coursesAll(),
      CacheKeys.modulesCourse(id),
      CacheKeys.finalQuizQuestions(id),
      ...moduleIds.map((moduleId) => CacheKeys.moduleDocuments(moduleId)),
      ...moduleIds.map((moduleId) => CacheKeys.moduleQuestions(id, moduleId)),
    )

    return { message: 'Deleted successfully' }
  }

  private async invalidateQuestionCaches(
    courseId?: number,
    moduleId?: number,
    type?: string,
  ) {
    if (!courseId || !type) {
      return
    }

    if (type === 'final') {
      await this.redisService.del(CacheKeys.finalQuizQuestions(courseId))
      return
    }

    if (typeof moduleId === 'number') {
      await this.redisService.del(CacheKeys.moduleQuestions(courseId, moduleId))
    }
  }

  private async invalidateCourseCaches(courseId: number) {
    const enrollments = await this.enrollmentRepo.find({
      where: { courseId },
      select: ['userId'],
    })

    const userCourseKeys = Array.from(
      new Set(enrollments.map((enrollment) => CacheKeys.coursesUser(enrollment.userId))),
    )

    await this.redisService.del(
      CacheKeys.coursesAll(),
      ...userCourseKeys,
    )
  }

}
