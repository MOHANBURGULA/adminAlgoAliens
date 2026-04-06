// src/admin/super-admin.service.ts
// All business logic for Super Admin operations.
// Super Admin can: list admins, create admins, update admins, delete/demote admins.

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../users/user.entity'

// ── DTOs (inline — no extra files needed) ──────────────────────────────────

export interface CreateAdminDto {
  name:     string
  email:    string
  password: string
}

export interface UpdateAdminDto {
  name?:     string
  email?:    string
  password?: string
}

// ── SERVICE ────────────────────────────────────────────────────────────────

@Injectable()
export class SuperAdminService {

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ── LIST ALL ADMINS ────────────────────────────────────────────────────

  // Returns all users with role 'admin'.
  // Super Admin can see who the current admins are.
  async getAllAdmins(): Promise<Partial<User>[]> {
    return this.userRepo.find({
      where:  { role: 'admin' },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
      order:  { createdAt: 'DESC' },
    })
  }

  // ── GET SINGLE ADMIN ───────────────────────────────────────────────────

  async getAdminById(adminId: number): Promise<Partial<User>> {
    const admin = await this.userRepo.findOne({
      where:  { id: adminId, role: 'admin' },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    })

    if (!admin) {
      throw new NotFoundException(`Admin with id ${adminId} not found`)
    }

    return admin
  }

  // ── CREATE ADMIN ───────────────────────────────────────────────────────

  // Creates a brand-new user with role = 'admin'.
  // Throws ConflictException if email is already registered.
  async createAdmin(dto: CreateAdminDto): Promise<Partial<User>> {
    // Normalize email
    const email = dto.email.trim().toLowerCase()

    // Check for duplicate
    const existing = await this.userRepo.findOne({ where: { email } })
    if (existing) {
      throw new ConflictException(`User with email ${email} already exists`)
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const newAdmin = this.userRepo.create({
      name:     dto.name.trim(),
      email,
      password: hashedPassword,
      role:     'admin',           // always admin, Super Admin decides this
    })

    const saved = await this.userRepo.save(newAdmin)

    // Return without password
    return {
      id:        saved.id,
      name:      saved.name,
      email:     saved.email,
      role:      saved.role,
      createdAt: saved.createdAt,
    }
  }

  // ── UPDATE ADMIN ───────────────────────────────────────────────────────

  // Super Admin can update an admin's name, email, or reset their password.
  async updateAdmin(adminId: number, dto: UpdateAdminDto): Promise<Partial<User>> {
    const admin = await this.userRepo.findOne({ where: { id: adminId, role: 'admin' } })

    if (!admin) {
      throw new NotFoundException(`Admin with id ${adminId} not found`)
    }

    // If email is being changed — check it is not already taken
    if (dto.email) {
      const email = dto.email.trim().toLowerCase()
      const emailTaken = await this.userRepo.findOne({ where: { email } })
      if (emailTaken && emailTaken.id !== adminId) {
        throw new ConflictException(`Email ${email} is already in use`)
      }
      dto.email = email
    }

    // If password is being changed — hash it
    const updateData: Partial<User> = {}
    if (dto.name)     updateData.name     = dto.name.trim()
    if (dto.email)    updateData.email    = dto.email
    if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10)

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided to update')
    }

    await this.userRepo.update(adminId, updateData)

    return this.userRepo.findOne({
      where:  { id: adminId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    }) as Promise<Partial<User>>
  }

  // ── DELETE ADMIN ───────────────────────────────────────────────────────

  // Permanently deletes a user with role 'admin'.
  // Super Admin cannot delete themselves (guard blocks superadmin from this service).
  async deleteAdmin(adminId: number): Promise<{ message: string }> {
    const admin = await this.userRepo.findOne({ where: { id: adminId, role: 'admin' } })

    if (!admin) {
      throw new NotFoundException(`Admin with id ${adminId} not found`)
    }

    await this.userRepo.remove(admin)

    return { message: `Admin ${admin.email} has been deleted successfully` }
  }

  // ── DEMOTE ADMIN TO STUDENT ────────────────────────────────────────────

  // Instead of deleting — Super Admin can demote an admin back to student.
  async demoteAdminToStudent(adminId: number): Promise<Partial<User>> {
    const admin = await this.userRepo.findOne({ where: { id: adminId, role: 'admin' } })

    if (!admin) {
      throw new NotFoundException(`Admin with id ${adminId} not found`)
    }

    await this.userRepo.update(adminId, { role: 'student' })

    return this.userRepo.findOne({
      where:  { id: adminId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    }) as Promise<Partial<User>>
  }

  // ── PROMOTE STUDENT TO ADMIN ───────────────────────────────────────────

  // Super Admin can promote any existing student to admin.
  async promoteStudentToAdmin(userId: number): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id: userId } })

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`)
    }

    if (user.role === 'admin') {
      throw new BadRequestException(`User ${user.email} is already an admin`)
    }

    if (user.role === 'superadmin') {
      throw new BadRequestException(`Cannot change role of a Super Admin`)
    }

    await this.userRepo.update(userId, { role: 'admin' })

    return this.userRepo.findOne({
      where:  { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    }) as Promise<Partial<User>>
  }

  // ── SUPER ADMIN DASHBOARD ─────────────────────────────────────────────

  // Quick stats overview for Super Admin
  async getSuperAdminDashboard() {
    const [totalAdmins, totalStudents, totalSuperAdmins] = await Promise.all([
      this.userRepo.count({ where: { role: 'admin' } }),
      this.userRepo.count({ where: { role: 'student' } }),
      this.userRepo.count({ where: { role: 'superadmin' } }),
    ])

    return {
      totalAdmins,
      totalStudents,
      totalSuperAdmins,
      totalUsers: totalAdmins + totalStudents + totalSuperAdmins,
    }
  }
}