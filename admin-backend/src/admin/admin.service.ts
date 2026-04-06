import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { ModuleActivity } from '../modules/module-activity.entity'
import { CourseModule } from '../modules/module.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Question } from '../questions/question.entity'
import { Certificate } from '../certificates/certificate.entity'
import { Project } from '../projects/projects.entity'
import { Video } from '../videos/video.entity'
import { Course } from '../courses/course.entity'
import { CourseCategory } from '../courses/course-category.entity'
import { CertificatesService } from '../certificates/certificates.service'
import { S3Service } from '../s3/s3.service'
import { CacheKeys } from '../redis/cache.helpers'
import { RedisService } from '../redis/redis.service'
import {
  CodeExecutionService,
  type CodeExecutionRequest,
} from './code-execution.service'

const MAX_REJECTIONS = Number(process.env.MAX_VIDEO_REJECTIONS || '4')
const MODULE_ACTIVITY_TYPES = new Set(['sql_debugging', 'coding', 'analysis', 'quiz'])

type ModuleActivityPayload = {
  moduleId: number
  title: string
  description?: string
  activityType: string
  orderIndex?: number
  config?: Record<string, unknown>
}

type ModuleActivityUpdatePayload = {
  moduleId?: number
  title?: string
  description?: string
  activityType?: string
  orderIndex?: number
  config?: Record<string, unknown>
}

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

    @InjectRepository(ModuleActivity)
    private activityRepo: Repository<ModuleActivity>,

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

    @InjectRepository(CourseCategory)
    private categoryRepo: Repository<CourseCategory>,

    private certificatesService: CertificatesService,
    private s3Service: S3Service,
    private readonly redisService: RedisService,
    private readonly codeExecutionService: CodeExecutionService,
  ) {}

  getAllUsers() {
    return this.userRepo.find({ select: ['id', 'name', 'email', 'role', 'createdAt'] })
  }

  async getUserById(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    })

    if (!user) return null

    const [enrollments, evaluations, certificates] = await Promise.all([
      this.enrollmentRepo.find({ where: { userId } }),
      this.evaluationRepo.find({ where: { userId } }),
      this.certificateRepo.find({ where: { userId } }),
    ])

    return { ...user, enrollments, evaluations, certificates }
  }

  async getAdminDashboard() {
    const [
      totalUsers,
      totalEnrollments,
      totalCertificates,
      pendingEvaluations,
      pendingProjects,
      pendingVideos,
      allCourses,
    ] = await Promise.all([
      this.userRepo.count({ where: { role: 'student' } }),
      this.enrollmentRepo.count(),
      this.certificateRepo.count(),
      this.evaluationRepo.count({ where: { status: 'processing' } }),
      this.projectRepo.count({ where: { status: 'pending' } }),
      this.videoRepo.count({ where: { status: 'under_review' } }),
      this.courseRepo.find(),
    ])

    return {
      totalStudents: totalUsers,
      totalEnrollments,
      totalCertificates,
      pendingEvaluations,
      pendingProjects,
      pendingVideos,
      totalCourses: allCourses.length,
    }
  }

  async getAnalyticsByCategory() {
    const categories = await this.categoryRepo.find()

    return Promise.all(
      categories.map(async (category) => {
        const coursesInCategory = await this.courseRepo.find({
          where: { categoryId: category.id },
        })
        const courseIds = coursesInCategory.map((course) => course.id)

        const [enrollmentCount, certificateCount] = await Promise.all([
          courseIds.length > 0
            ? this.enrollmentRepo.count({ where: { courseId: In(courseIds) } })
            : Promise.resolve(0),
          courseIds.length > 0
            ? this.certificateRepo.count({ where: { courseId: In(courseIds) } })
            : Promise.resolve(0),
        ])

        return {
          categoryId: category.id,
          categoryName: category.name,
          courseCount: coursesInCategory.length,
          enrollmentCount,
          certificateCount,
        }
      }),
    )
  }

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

  async getCourseProgress(courseId: number) {
    const enrollments = await this.enrollmentRepo.find({ where: { courseId } })

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const completedModules = await this.progressRepo.find({
          where: { userId: enrollment.userId, courseId, completed: true },
        })
        const evaluation = await this.evaluationRepo.findOne({
          where: { userId: enrollment.userId, courseId },
        })
        const certificate = await this.certificateRepo.findOne({
          where: { userId: enrollment.userId, courseId },
        })

        return {
          userId: enrollment.userId,
          enrollmentId: enrollment.id,
          progress: enrollment.progress,
          modulesCompleted: completedModules.length,
          quizScores: completedModules.map((moduleProgress) => ({
            moduleId: moduleProgress.moduleId,
            score: moduleProgress.quizScore,
          })),
          evaluation: evaluation
            ? { status: evaluation.status, finalScore: evaluation.finalScore }
            : null,
          certificate: certificate
            ? { id: certificate.id, score: certificate.score }
            : null,
        }
      }),
    )
  }

  manuallyReleaseCertificate(userId: number, courseId: number) {
    return this.certificatesService.manuallyIssueCertificate(userId, courseId)
  }

  getAllProjects() {
    return this.projectRepo.find()
  }

  async updateProjectStatus(id: number, status: string, feedback?: string) {
    const updateData: Partial<Project> & { feedback?: string } = { status }
    if (feedback) {
      updateData.feedback = feedback
    }

    await this.projectRepo.update(id, updateData)
    const updated = await this.projectRepo.findOne({ where: { id } })
    if (!updated) return { message: 'Updated successfully', id, status, feedback }
    return updated
  }

  getAllVideos() {
    return this.videoRepo.find()
  }

  async updateVideoStatus(id: number, status: string, feedback?: string) {
    const video = await this.videoRepo.findOne({ where: { id } })
    if (!video) throw new NotFoundException('Video not found')

    const updateData: Partial<Video> = { status }

    if (feedback !== undefined) {
      updateData.feedback = feedback
    }

    if (status === 'rejected') {
      const newCount = (video.rejectionCount || 0) + 1
      updateData.rejectionCount = newCount

      if (newCount >= MAX_REJECTIONS) {
        updateData.status = 'permanently_rejected'
      }
    }

    await this.videoRepo.update(id, updateData)
    const updatedVideo = await this.videoRepo.findOne({ where: { id } })

    if (status === 'approved' && updatedVideo && updatedVideo.courseId) {
      await this.certificatesService.issueCertificate(
        updatedVideo.userId,
        updatedVideo.courseId,
        100,
      )
    }

    return updatedVideo
  }

  async createModule(data: { courseId: number; title: string; orderIndex: number }) {
    const moduleItem = this.moduleRepo.create(data)
    const savedModule = await this.moduleRepo.save(moduleItem)
    await this.redisService.del(CacheKeys.modulesCourse(savedModule.courseId))
    return savedModule
  }

  async updateModule(id: number, data: { title?: string; orderIndex?: number }) {
    const existingModule = await this.moduleRepo.findOne({ where: { id } })
    await this.moduleRepo.update(id, data)
    const updatedModule = await this.moduleRepo.findOne({ where: { id } })
    const courseIds = new Set<number>()

    if (existingModule) courseIds.add(existingModule.courseId)
    if (updatedModule) courseIds.add(updatedModule.courseId)

    await this.redisService.del(
      ...Array.from(courseIds).map((courseId) => CacheKeys.modulesCourse(courseId)),
    )

    return updatedModule
  }

  async deleteModule(id: number) {
    const existingModule = await this.moduleRepo.findOne({ where: { id } })
    await this.activityRepo.delete({ moduleId: id })
    await this.documentRepo.delete({ moduleId: id })
    const result = await this.moduleRepo.delete(id)

    await this.redisService.del(
      CacheKeys.moduleActivities(id),
      CacheKeys.moduleDocuments(id),
      ...(existingModule ? [CacheKeys.moduleQuestions(existingModule.courseId, id)] : []),
      ...(existingModule ? [CacheKeys.modulesCourse(existingModule.courseId)] : []),
    )

    return result
  }

  async createModuleDocument(data: {
    moduleId: number
    label: string
    title: string
    fileUrl: string
  }) {
    const document = this.documentRepo.create(data)
    const savedDocument = await this.documentRepo.save(document)
    await this.redisService.del(CacheKeys.moduleDocuments(savedDocument.moduleId))
    return savedDocument
  }

  async updateModuleDocument(
    id: number,
    data: { label?: string; title?: string; fileUrl?: string },
  ) {
    const existingDocument = await this.documentRepo.findOne({ where: { id } })
    await this.documentRepo.update(id, data)
    const updatedDocument = await this.documentRepo.findOne({ where: { id } })
    const moduleIds = new Set<number>()

    if (existingDocument) moduleIds.add(existingDocument.moduleId)
    if (updatedDocument) moduleIds.add(updatedDocument.moduleId)

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

  getModuleActivities(moduleId: number) {
    return this.activityRepo.find({
      where: { moduleId },
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    })
  }

  async createModuleActivity(data: ModuleActivityPayload) {
    await this.ensureModuleExists(data.moduleId)

    const activity = this.activityRepo.create({
      moduleId: data.moduleId,
      title: this.requireNonEmptyString(data.title, 'Activity title is required'),
      description: typeof data.description === 'string' ? data.description.trim() : '',
      activityType: this.normalizeActivityType(data.activityType),
      orderIndex: this.normalizeOrderIndex(data.orderIndex),
      config: this.normalizeActivityConfig(data.config),
    })

    const savedActivity = await this.activityRepo.save(activity)
    await this.redisService.del(CacheKeys.moduleActivities(savedActivity.moduleId))
    return savedActivity
  }

  async updateModuleActivity(id: number, data: ModuleActivityUpdatePayload) {
    const existingActivity = await this.activityRepo.findOne({ where: { id } })
    if (!existingActivity) throw new NotFoundException('Module activity not found')

    const updateData: Partial<ModuleActivity> = {}

    if (typeof data.moduleId === 'number') {
      await this.ensureModuleExists(data.moduleId)
      updateData.moduleId = data.moduleId
    }

    if (typeof data.title === 'string') {
      updateData.title = this.requireNonEmptyString(data.title, 'Activity title is required')
    }

    if (typeof data.description === 'string') {
      updateData.description = data.description.trim()
    }

    if (typeof data.activityType === 'string') {
      updateData.activityType = this.normalizeActivityType(data.activityType)
    }

    if (typeof data.orderIndex !== 'undefined') {
      updateData.orderIndex = this.normalizeOrderIndex(data.orderIndex)
    }

    if (typeof data.config !== 'undefined') {
      updateData.config = this.normalizeActivityConfig(data.config)
    }

    const updatedActivity = await this.activityRepo.save({
      ...existingActivity,
      ...updateData,
    })

    await this.redisService.del(
      CacheKeys.moduleActivities(existingActivity.moduleId),
      ...(updatedActivity && updatedActivity.moduleId !== existingActivity.moduleId
        ? [CacheKeys.moduleActivities(updatedActivity.moduleId)]
        : []),
    )

    return updatedActivity
  }

  async deleteModuleActivity(id: number) {
    const existingActivity = await this.activityRepo.findOne({ where: { id } })
    if (!existingActivity) {
      throw new NotFoundException('Module activity not found')
    }

    const result = await this.activityRepo.delete(id)
    await this.redisService.del(CacheKeys.moduleActivities(existingActivity.moduleId))
    return result
  }

  async getCompilerLanguages() {
    return this.codeExecutionService.getCompilerLanguages()
  }

  async runCodeActivity(data: CodeExecutionRequest) {
    return this.codeExecutionService.runCodeActivity(data)
  }

  getDocumentUploadUrl(filename: string) {
    return this.s3Service.generateUploadUrl(`documents/${filename}`, 'text/markdown')
  }

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

  async getAllCoursesWithStats() {
    const [courses, categories] = await Promise.all([
      this.courseRepo.find(),
      this.categoryRepo.find(),
    ])
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

    return Promise.all(
      courses.map(async (course) => {
        const [moduleCount, enrollmentCount, certificateCount] = await Promise.all([
          this.moduleRepo.count({ where: { courseId: course.id } }),
          this.enrollmentRepo.count({ where: { courseId: course.id } }),
          this.certificateRepo.count({ where: { courseId: course.id } }),
        ])

        return {
          ...course,
          moduleCount,
          enrollmentCount,
          certificateCount,
          categoryName: course.categoryId ? categoryMap.get(course.categoryId) ?? null : null,
        }
      }),
    )
  }

  async createCourse(data: {
    title: string
    difficulty?: string
    description?: string
    keywords?: string[]
    categoryId?: string
  }) {
    const course = this.courseRepo.create({
      title: this.requireNonEmptyString(data.title, 'Course title is required'),
      difficulty: this.normalizeCourseDifficulty(data.difficulty),
      description: typeof data.description === 'string' ? data.description.trim() : undefined,
      keywords: Array.isArray(data.keywords)
        ? data.keywords.map((keyword) => keyword.trim()).filter(Boolean)
        : undefined,
      categoryId: typeof data.categoryId === 'string' && data.categoryId.trim()
        ? data.categoryId
        : undefined,
    })
    const savedCourse = await this.courseRepo.save(course)
    await this.redisService.del(CacheKeys.coursesAll())
    return savedCourse
  }

  async updateCourse(
    id: number,
    data: {
      title?: string
      difficulty?: string
      description?: string
      keywords?: string[]
      categoryId?: string
    },
  ) {
    const updateData: Partial<Course> = {}

    if (typeof data.title === 'string') {
      updateData.title = this.requireNonEmptyString(data.title, 'Course title is required')
    }

    if (typeof data.difficulty === 'string') {
      updateData.difficulty = this.normalizeCourseDifficulty(data.difficulty)
    }

    if (typeof data.description === 'string') {
      updateData.description = data.description.trim()
    }

    if (Array.isArray(data.keywords)) {
      updateData.keywords = data.keywords.map((keyword) => keyword.trim()).filter(Boolean)
    }

    if (typeof data.categoryId === 'string') {
      updateData.categoryId = data.categoryId.trim() ? data.categoryId : null
    }

    await this.courseRepo.update(id, updateData)
    const updatedCourse = await this.courseRepo.findOne({ where: { id } })
    await this.invalidateCourseCaches(id)
    return updatedCourse
  }

  async deleteCourse(id: number) {
    const course = await this.courseRepo.findOne({ where: { id } })
    if (!course) throw new NotFoundException('Course not found')

    const enrollmentCount = await this.enrollmentRepo.count({ where: { courseId: id } })
    if (enrollmentCount > 0) {
      throw new BadRequestException('Cannot delete course with enrollments')
    }

    const modules = await this.moduleRepo.find({ where: { courseId: id } })
    const moduleIds = modules.map((moduleItem) => moduleItem.id)

    if (moduleIds.length > 0) {
      await this.activityRepo.delete({ moduleId: In(moduleIds) })
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
      ...moduleIds.map((moduleId) => CacheKeys.moduleActivities(moduleId)),
      ...moduleIds.map((moduleId) => CacheKeys.moduleDocuments(moduleId)),
      ...moduleIds.map((moduleId) => CacheKeys.moduleQuestions(id, moduleId)),
    )

    return { message: 'Deleted successfully' }
  }

  createCategory(data: { name: string; description?: string }) {
    const category = this.categoryRepo.create(data)
    return this.categoryRepo.save(category)
  }

  getAllCategories() {
    return this.categoryRepo.find({ order: { name: 'ASC' } })
  }

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    await this.categoryRepo.update(id, data)
    return this.categoryRepo.findOne({ where: { id } })
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id } })
    if (!category) throw new NotFoundException('Category not found')

    const linkedCourses = await this.courseRepo.count({ where: { categoryId: id } })
    if (linkedCourses > 0) {
      throw new BadRequestException(
        `Cannot delete category because ${linkedCourses} course(s) are assigned to it`,
      )
    }

    await this.categoryRepo.delete(id)
    return { message: 'Category deleted successfully' }
  }

  getTemplates() {
    return [
      {
        type: 'certificate',
        label: 'Certificate template',
        description: 'HTML template used when generating certificates',
      },
      {
        type: 'email_welcome',
        label: 'Welcome email',
        description: 'Sent to users on signup',
      },
      {
        type: 'email_reset',
        label: 'Password reset email',
        description: 'Sent when user requests a password reset',
      },
    ]
  }

  getTemplateUploadUrl(filename: string) {
    return this.s3Service.generateUploadUrl(`templates/${filename}`)
  }

  private async invalidateQuestionCaches(
    courseId?: number,
    moduleId?: number,
    type?: string,
  ) {
    if (!courseId || !type) return

    if (type === 'final') {
      await this.redisService.del(CacheKeys.finalQuizQuestions(courseId))
      return
    }

    if (typeof moduleId === 'number') {
      await this.redisService.del(CacheKeys.moduleQuestions(courseId, moduleId))
    }
  }

  private normalizeCourseDifficulty(value?: string) {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
    return normalized || 'general'
  }

  private async invalidateCourseCaches(courseId: number) {
    const enrollments = await this.enrollmentRepo.find({
      where: { courseId },
      select: ['userId'],
    })
    const userCourseKeys = Array.from(
      new Set(enrollments.map((enrollment) => CacheKeys.coursesUser(enrollment.userId))),
    )

    await this.redisService.del(CacheKeys.coursesAll(), ...userCourseKeys)
  }

  private async ensureModuleExists(moduleId: number) {
    const moduleItem = await this.moduleRepo.findOne({ where: { id: moduleId } })
    if (!moduleItem) {
      throw new NotFoundException('Module not found')
    }
    return moduleItem
  }

  private normalizeActivityType(activityType: string) {
    const normalizedType = activityType.trim().toLowerCase()
    if (!MODULE_ACTIVITY_TYPES.has(normalizedType)) {
      throw new BadRequestException('Unsupported activity type')
    }
    return normalizedType
  }

  private normalizeActivityConfig(config?: Record<string, unknown>) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return {}
    }

    return config
  }

  private normalizeOrderIndex(orderIndex?: number) {
    const normalizedOrderIndex = Number(orderIndex)
    if (!Number.isFinite(normalizedOrderIndex) || normalizedOrderIndex < 1) {
      return 1
    }

    return Math.floor(normalizedOrderIndex)
  }

  private requireNonEmptyString(value: string, message: string) {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      throw new BadRequestException(message)
    }
    return normalizedValue
  }

}
