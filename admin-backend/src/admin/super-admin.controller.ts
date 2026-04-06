// src/admin/super-admin.controller.ts
// All Super Admin routes are under /api/super-admin
// Protected by JwtAuthGuard + SuperAdminGuard on every route.

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard }    from '../auth/jwt-auth.guard'
import { SuperAdminGuard } from './super-admin.guard'
import { SuperAdminService } from './super-admin.service'
import type { CreateAdminDto, UpdateAdminDto } from './super-admin.service'
@Controller('api/super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)   // All routes need valid JWT + superadmin role
export class SuperAdminController {

  constructor(private readonly superAdminService: SuperAdminService) {}

  // ── DASHBOARD ──────────────────────────────────────────────────────────
  // GET /api/super-admin/dashboard
  // Returns counts: total admins, students, superadmins
  @Get('dashboard')
  getDashboard() {
    return this.superAdminService.getSuperAdminDashboard()
  }

  // ── ADMIN MANAGEMENT ───────────────────────────────────────────────────

  // GET /api/super-admin/admins
  // List all users with role 'admin'
  @Get('admins')
  getAllAdmins() {
    return this.superAdminService.getAllAdmins()
  }

  // GET /api/super-admin/admins/:id
  // Get a single admin by their user id
  @Get('admins/:id')
  getAdminById(@Param('id') id: string) {
    return this.superAdminService.getAdminById(Number(id))
  }

  // POST /api/super-admin/admins
  // Create a brand-new admin account
  // Body: { name, email, password }
  @Post('admins')
  createAdmin(@Body() body: CreateAdminDto) {
    return this.superAdminService.createAdmin(body)
  }

  // PUT /api/super-admin/admins/:id
  // Update an admin's name, email, or password
  // Body: { name?, email?, password? }
  @Put('admins/:id')
  updateAdmin(
    @Param('id') id: string,
    @Body() body: UpdateAdminDto,
  ) {
    return this.superAdminService.updateAdmin(Number(id), body)
  }

  // DELETE /api/super-admin/admins/:id
  // Permanently delete an admin user
  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.superAdminService.deleteAdmin(Number(id))
  }

  // ── ROLE MANAGEMENT ────────────────────────────────────────────────────

  // PUT /api/super-admin/admins/:id/demote
  // Demote an admin back to student (keeps the account, just changes role)
  @Put('admins/:id/demote')
  demoteAdmin(@Param('id') id: string) {
    return this.superAdminService.demoteAdminToStudent(Number(id))
  }

  // PUT /api/super-admin/users/:id/promote
  // Promote an existing student to admin role
  @Put('users/:id/promote')
  promoteToAdmin(@Param('id') id: string) {
    return this.superAdminService.promoteStudentToAdmin(Number(id))
  }
}