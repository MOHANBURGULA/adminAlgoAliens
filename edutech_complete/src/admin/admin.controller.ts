import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from './admin.guard'

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {

  constructor(private service: AdminService) {}

  // ── DASHBOARD ────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.service.getAdminDashboard()
  }

  // ── USERS ────────────────────────────────────────────────────
  @Get('users')
  getAllUsers() {
    return this.service.getAllUsers()
  }

  @Get('users/:userId')
  getUserById(@Param('userId') userId: string) {
    return this.service.getUserById(Number(userId))
  }

  @Put('users/:userId/role')
  changeUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: string }
  ) {
    return this.service.changeUserRole(Number(userId), body.role)
  }

  // ── PROGRESS MONITORING ──────────────────────────────────────
  @Get('enrollments')
  getAllEnrollments() {
    return this.service.getAllEnrollments()
  }

  @Get('enrollments/user/:userId')
  getUserEnrollments(@Param('userId') userId: string) {
    return this.service.getUserEnrollments(Number(userId))
  }

  @Get('evaluations')
  getAllEvaluations() {
    return this.service.getAllEvaluations()
  }

  @Get('evaluations/user/:userId')
  getUserEvaluations(@Param('userId') userId: string) {
    return this.service.getUserEvaluations(Number(userId))
  }

  @Get('certificates')
  getAllCertificates() {
    return this.service.getAllCertificates()
  }

  @Get('course-progress/:courseId')
  getCourseProgress(@Param('courseId') courseId: string) {
    return this.service.getCourseProgress(Number(courseId))
  }

  // ── CERTIFICATE MANAGEMENT ───────────────────────────────────
  @Post('certificates/release')
  releaseCertificate(@Body() body: { userId: number; courseId: number }) {
    return this.service.manuallyReleaseCertificate(body.userId, body.courseId)
  }

  // ── PROJECT MANAGEMENT ───────────────────────────────────────
  @Get('projects')
  getAllProjects() {
    return this.service.getAllProjects()
  }

  @Put('projects/:id/status')
  updateProjectStatus(
    @Param('id') id: string,
    @Body() body: { status: string; feedback?: string }
  ) {
    return this.service.updateProjectStatus(Number(id), body.status, body.feedback)
  }

  // ── VIDEO MANAGEMENT ─────────────────────────────────────────
  @Get('videos')
  getAllVideos() {
    return this.service.getAllVideos()
  }

  @Put('videos/:id/status')
  updateVideoStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.service.updateVideoStatus(Number(id), body.status)
  }

  // ── MODULE MANAGEMENT ────────────────────────────────────────
  @Post('modules')
  createModule(@Body() body: { courseId: number; title: string; orderIndex: number }) {
    return this.service.createModule(body)
  }

  @Put('modules/:id')
  updateModule(
    @Param('id') id: string,
    @Body() body: { title?: string; orderIndex?: number }
  ) {
    return this.service.updateModule(Number(id), body)
  }

  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.service.deleteModule(Number(id))
  }

  @Post('modules/documents')
  createDocument(@Body() body: { moduleId: number; label: string; title: string; fileUrl: string }) {
    return this.service.createModuleDocument(body)
  }

  @Put('modules/documents/:id')
  updateDocument(
    @Param('id') id: string,
    @Body() body: { label?: string; title?: string; fileUrl?: string }
  ) {
    return this.service.updateModuleDocument(Number(id), body)
  }

  @Delete('modules/documents/:id')
  deleteDocument(@Param('id') id: string) {
    return this.service.deleteModuleDocument(Number(id))
  }

  @Get('modules/documents/upload-url')
  getDocumentUploadUrl(@Query('filename') filename: string) {
    return this.service.getDocumentUploadUrl(filename)
  }

  // ── QUESTION MANAGEMENT ──────────────────────────────────────
  @Get('questions/:courseId')
  getCourseQuestions(@Param('courseId') courseId: string) {
    return this.service.getCourseQuestions(Number(courseId))
  }

  @Post('questions')
  createQuestion(@Body() body: any) {
    return this.service.createQuestion(body)
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.service.updateQuestion(Number(id), body)
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.service.deleteQuestion(Number(id))
  }

  // ── COURSE MANAGEMENT ────────────────────────────────────────
  @Get('courses')
  getAllCoursesWithStats() {
    return this.service.getAllCoursesWithStats()
  }

  @Post('courses')
  createCourse(@Body() body: { title: string; difficulty: string }) {
    return this.service.createCourse(body)
  }

  @Put('courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body() body: { title?: string; difficulty?: string }
  ) {
    return this.service.updateCourse(Number(id), body)
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.service.deleteCourse(Number(id))
  }

}
