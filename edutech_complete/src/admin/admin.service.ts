import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
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
    private s3Service: S3Service
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

  createModule(data: { courseId: number; title: string; orderIndex: number }) {
    const module = this.moduleRepo.create(data)
    return this.moduleRepo.save(module)
  }

  async updateModule(id: number, data: { title?: string; orderIndex?: number }) {
    await this.moduleRepo.update(id, data)
    return this.moduleRepo.findOne({ where: { id } })
  }

  async deleteModule(id: number) {
    await this.documentRepo.delete({ moduleId: id })
    return this.moduleRepo.delete(id)
  }

  createModuleDocument(data: { moduleId: number; label: string; title: string; fileUrl: string }) {
    const doc = this.documentRepo.create(data)
    return this.documentRepo.save(doc)
  }

  async updateModuleDocument(id: number, data: { label?: string; title?: string; fileUrl?: string }) {
    await this.documentRepo.update(id, data)
    return this.documentRepo.findOne({ where: { id } })
  }

  deleteModuleDocument(id: number) {
    return this.documentRepo.delete(id)
  }

  getDocumentUploadUrl(filename: string) {
    return this.s3Service.generateUploadUrl(`documents/${filename}`)
  }

  // ── QUESTION MANAGEMENT ──────────────────────────────────────

  createQuestion(data: any) {
    const question = this.questionRepo.create(data)
    return this.questionRepo.save(question)
  }

  getCourseQuestions(courseId: number) {
    return this.questionRepo.find({ where: { courseId } })
  }

  async updateQuestion(id: number, data: Partial<Question>) {
    await this.questionRepo.update(id, data)
    return this.questionRepo.findOne({ where: { id } })
  }

  deleteQuestion(id: number) {
    return this.questionRepo.delete(id)
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

  createCourse(data: { title: string; difficulty: string }) {
    const course = this.courseRepo.create(data)
    return this.courseRepo.save(course)
  }

  async updateCourse(id: number, data: { title?: string; difficulty?: string }) {
    await this.courseRepo.update(id, data)
    return this.courseRepo.findOne({ where: { id } })
  }

}