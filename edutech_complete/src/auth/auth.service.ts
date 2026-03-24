import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { MailService } from '../mail/mail.service'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'

type SignupPayload = {
  name: string
  email: string
  password: string
}

type LoginPayload = {
  email: string
  password: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private normalizeName(name: string) {
    return name.trim()
  }

  private getConfiguredAdminRole(email: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    const adminRole = process.env.ADMIN_ROLE || 'admin'

    if (adminEmail && this.normalizeEmail(email) === adminEmail) {
      return adminRole
    }

    return 'student'
  }

  private getConfiguredAdminEmail() {
    return process.env.ADMIN_EMAIL?.toLowerCase() || null
  }

  private isConfiguredAdminCredentials(email: string, password: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD

    return Boolean(
      adminEmail &&
        adminPassword &&
        this.normalizeEmail(email) === adminEmail &&
        password === adminPassword,
    )
  }

  private async ensureConfiguredRole(user: User) {
    const configuredAdminEmail = this.getConfiguredAdminEmail()
    const adminRole = process.env.ADMIN_ROLE || 'admin'

    if (configuredAdminEmail && user.email.toLowerCase() === configuredAdminEmail) {
      if (user.role !== adminRole) {
        return this.usersService.updateRole(user.id, adminRole)
      }
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

  async signup(data: SignupPayload) {
    const normalizedData = {
      ...data,
      email: this.normalizeEmail(data.email),
      name: this.normalizeName(data.name),
    }

    const existingUser = await this.usersService.findByEmail(normalizedData.email)
    if (existingUser) {
      throw new BadRequestException('User already exists')
    }

    const hashedPassword = await bcrypt.hash(normalizedData.password, 10)
    const createdUser: User = await this.usersService.create({
      name: normalizedData.name,
      email: normalizedData.email,
      password: hashedPassword,
      role: this.getConfiguredAdminRole(normalizedData.email),
    })
    const user = (await this.ensureConfiguredRole(createdUser)) as User

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    this.logger.debug(`Signup success email=${user.email} role=${user.role} tokenIssued=true`)

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  }

  async login(data: LoginPayload) {
    const normalizedData = {
      ...data,
      email: this.normalizeEmail(data.email),
    }

    if (this.isConfiguredAdminCredentials(normalizedData.email, normalizedData.password)) {
      const adminUser = await this.ensureConfiguredAdminAccount(
        normalizedData.email,
        normalizedData.password,
      )

      const token = this.jwtService.sign({
        sub: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      })

      this.logger.debug(`Login success email=${adminUser.email} role=${adminUser.role} tokenIssued=true`)

      return {
        token,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      }
    }

    const existingUser = await this.usersService.findByEmail(normalizedData.email)

    if (!existingUser) {
      this.logger.warn(`Login failed: user not found for ${normalizedData.email}`)
      throw new UnauthorizedException('User not found')
    }

    if (existingUser.password === 'GOOGLE_AUTH') {
      this.logger.warn(`Login failed: Google account attempted password login for ${existingUser.email}`)
      throw new UnauthorizedException('Use Google login')
    }

    const valid = await bcrypt.compare(normalizedData.password, existingUser.password)

    if (!valid) {
      this.logger.warn(`Login failed: invalid password for ${existingUser.email}`)
      throw new UnauthorizedException('Invalid password')
    }

    const user = (await this.ensureConfiguredRole(existingUser)) as User

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    this.logger.debug(`Login success email=${user.email} role=${user.role} tokenIssued=true`)

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  }

  async logout(userId: number) {
    return {
      message: 'Logged out successfully. Please delete the token on the client side.',
      userId,
    }
  }

  async changePassword(userId: number) {
    const user = await this.usersService.findById(userId)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const token = this.jwtService.sign(
      {
        userId: user.id,
        email: user.email,
      },
      {
        expiresIn: '15m',
      },
    )

    await this.mailService.sendResetEmail(user.email, token)

    return { message: 'Reset link sent to your email' }
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required')
    }

    let payload: { userId: number; email: string }

    try {
      payload = this.jwtService.verify<{ userId: number; email: string }>(token)
    } catch {
      throw new BadRequestException('Reset token is invalid or expired')
    }

    const user = await this.usersService.findById(payload.userId)

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('User not found')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await this.usersService.setPasswordHash(user.id, hashedPassword)

    return { message: 'Password reset successfully' }
  }
}
