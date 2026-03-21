import { Injectable, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { User } from '../users/user.entity'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  private getConfiguredAdminRole(email: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    const adminRole = process.env.ADMIN_ROLE || 'admin'

    if (adminEmail && email.toLowerCase() === adminEmail) {
      return adminRole
    }

    return 'student'
  }

  private isConfiguredAdminCredentials(email: string, password: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD

    return Boolean(
      adminEmail &&
      adminPassword &&
      email.toLowerCase() === adminEmail &&
      password === adminPassword,
    )
  }

  private async ensureConfiguredRole(user: User) {
    const expectedRole = this.getConfiguredAdminRole(user.email)

    if (user.role !== expectedRole) {
      return this.usersService.updateRole(user.id, expectedRole)
    }

    return user
  }

  private async ensureConfiguredAdminAccount(email: string, password: string) {
    let user = await this.usersService.findByEmail(email)

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10)
      user = await this.usersService.create({
        name: 'Admin',
        email,
        password: hashedPassword,
        role: this.getConfiguredAdminRole(email),
      })

      return user
    }

    const updatedUser = await this.usersService.updateUser(user.id, {
      password,
      name: user.name || 'Admin',
    })

    if (!updatedUser) {
      throw new UnauthorizedException('Unable to update admin account')
    }

    return (await this.ensureConfiguredRole(updatedUser)) as User
  }

  async signup(data: any) {
    const existingUser = await this.usersService.findByEmail(data.email)
    if (existingUser) {
      throw new BadRequestException('User already exists')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const createdUser: User = await this.usersService.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: this.getConfiguredAdminRole(data.email)
    })
    const user = await this.ensureConfiguredRole(createdUser) as User

    const token = this.jwtService.sign({
      sub: user.id, email: user.email, name: user.name, role: user.role
    })

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  }

  async login(data: any) {

  if (this.isConfiguredAdminCredentials(data.email, data.password)) {
    const adminUser = await this.ensureConfiguredAdminAccount(data.email, data.password)

    const token = this.jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    })

    return {
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    }
  }

  const existingUser = await this.usersService.findByEmail(data.email)

  if (!existingUser) {
    throw new UnauthorizedException("User not found")
  }

  const valid = await bcrypt.compare(data.password, existingUser.password)

  if (!valid) {
    throw new UnauthorizedException("Invalid password")
  }

  const user = await this.ensureConfiguredRole(existingUser) as User

  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  })

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }
}

  async logout(userId: number) {
    return {
      message: 'Logged out successfully. Please delete the token on the client side.',
      userId
    }
  }

  // Change password — verifies old password before updating
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId)
    if (!user) return { message: 'User not found' }

    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) throw new BadRequestException('Old password is incorrect')

    await this.usersService.updateUser(userId, { password: newPassword })
    return { message: 'Password changed successfully' }
  }

}
