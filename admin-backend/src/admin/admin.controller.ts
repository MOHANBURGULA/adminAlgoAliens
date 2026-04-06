import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from './admin.guard'
import {
  CreateCategoryDto,
  CreateCourseDto,
  CreateModuleActivityDto,
  CreateModuleDocumentDto,
  CreateModuleDto,
  CreateQuestionDto,
  ExecuteCodeDto,
  ReleaseCertificateDto,
  UpdateCategoryDto,
  UpdateCourseDto,
  UpdateModuleActivityDto,
  UpdateModuleDocumentDto,
  UpdateModuleDto,
  UpdateQuestionDto,
  UpdateStatusDto,
} from './dto/admin.dto'

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {

  constructor(private service: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getAdminDashboard()
  }

  @Get('users')
  getAllUsers() {
    return this.service.getAllUsers()
  }

  @Get('users/:userId')
  getUserById(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getUserById(userId)
  }

  @Get('enrollments')
  getAllEnrollments() {
    return this.service.getAllEnrollments()
  }

  @Get('enrollments/user/:userId')
  getUserEnrollments(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getUserEnrollments(userId)
  }

  @Get('evaluations')
  getAllEvaluations() {
    return this.service.getAllEvaluations()
  }

  @Get('evaluations/user/:userId')
  getUserEvaluations(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getUserEvaluations(userId)
  }

  @Get('certificates')
  getAllCertificates() {
    return this.service.getAllCertificates()
  }

  @Get('course-progress/:courseId')
  getCourseProgress(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.getCourseProgress(courseId)
  }

  @Get('analytics/by-category')
  getAnalyticsByCategory() {
    return this.service.getAnalyticsByCategory()
  }

  @Post('certificates/release')
  releaseCertificate(@Body() body: ReleaseCertificateDto) {
    return this.service.manuallyReleaseCertificate(body.userId, body.courseId)
  }

  @Get('projects')
  getAllProjects() {
    return this.service.getAllProjects()
  }

  @Put('projects/:id/status')
  updateProjectStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
  ) {
    return this.service.updateProjectStatus(id, body.status, body.feedback)
  }

  @Get('videos')
  getAllVideos() {
    return this.service.getAllVideos()
  }

  @Put('videos/:id/status')
  updateVideoStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
  ) {
    return this.service.updateVideoStatus(id, body.status, body.feedback)
  }

  @Post('modules')
  createModule(@Body() body: CreateModuleDto) {
    return this.service.createModule(body)
  }

  @Put('modules/:id')
  updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateModuleDto,
  ) {
    return this.service.updateModule(id, body)
  }

  @Delete('modules/:id')
  deleteModule(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteModule(id)
  }

  @Post('modules/documents')
  createDocument(@Body() body: CreateModuleDocumentDto) {
    return this.service.createModuleDocument(body)
  }

  @Get('modules/:moduleId/activities')
  getModuleActivities(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.getModuleActivities(moduleId)
  }

  @Post('module-activities')
  createModuleActivity(@Body() body: CreateModuleActivityDto) {
    return this.service.createModuleActivity(body)
  }

  @Put('module-activities/:id')
  updateModuleActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateModuleActivityDto,
  ) {
    return this.service.updateModuleActivity(id, body)
  }

  @Delete('module-activities/:id')
  deleteModuleActivity(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteModuleActivity(id)
  }

  @Get('module-activities/languages')
  getCompilerLanguages() {
    return this.service.getCompilerLanguages()
  }

  @Post('module-activities/execute/code')
  runCodeActivity(@Body() body: ExecuteCodeDto) {
    return this.service.runCodeActivity(body)
  }

  @Put('modules/documents/:id')
  updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateModuleDocumentDto,
  ) {
    return this.service.updateModuleDocument(id, body)
  }

  @Delete('modules/documents/:id')
  deleteDocument(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteModuleDocument(id)
  }

  @Get('modules/documents/upload-url')
  getDocumentUploadUrl(@Query('filename') filename: string) {
    return this.service.getDocumentUploadUrl(filename)
  }

  @Get('questions/:courseId')
  getCourseQuestions(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.getCourseQuestions(courseId)
  }

  @Post('questions')
  createQuestion(@Body() body: CreateQuestionDto) {
    return this.service.createQuestion(body)
  }

  @Put('questions/:id')
  updateQuestion(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateQuestionDto) {
    return this.service.updateQuestion(id, body)
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteQuestion(id)
  }

  @Get('courses')
  getAllCoursesWithStats() {
    return this.service.getAllCoursesWithStats()
  }

  @Post('courses')
  createCourse(@Body() body: CreateCourseDto) {
    return this.service.createCourse(body)
  }

  @Put('courses/:id')
  updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCourseDto,
  ) {
    return this.service.updateCourse(id, body)
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteCourse(id)
  }

  @Get('categories')
  getAllCategories() {
    return this.service.getAllCategories()
  }

  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.service.createCategory(body)
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.service.updateCategory(id, body)
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id)
  }

  @Get('templates')
  getTemplates() {
    return this.service.getTemplates()
  }

  @Get('templates/upload-url')
  getTemplateUploadUrl(@Query('filename') filename: string) {
    return this.service.getTemplateUploadUrl(filename)
  }
}
