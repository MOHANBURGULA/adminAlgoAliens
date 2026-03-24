import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  private getConfiguredAdminRole(email: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    const adminRole = process.env.ADMIN_ROLE || 'admin'

    if (adminEmail && email.toLowerCase() === adminEmail) {
      return adminRole
    }

    return 'student'
  }

  private isConfiguredAdminEmail(email: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    return Boolean(adminEmail && email.toLowerCase() === adminEmail)
  }

  @Post('signup')
  signup(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.signup(body)
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body)
  }

  @Get('change-password')
  getChangePasswordInfo() {
    return {
      message: 'Use POST /api/auth/change-password with a valid Bearer token to send a reset link.',
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: { user: { id: number } }) {
    return this.authService.changePassword(req.user.id)
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword)
  }

  @Post('google')
  async googleLogin(@Body() body: { email: string; name: string }) {
    const { email, name } = body

    let user = await this.usersService.findByEmail(email)

    // ✅ If new user → create
    if (!user) {
      user = await this.usersService.create({
        email,
        name,
        password: 'GOOGLE_AUTH',
        role: this.getConfiguredAdminRole(email),
      })
    } else if (this.isConfiguredAdminEmail(email) && user.role !== this.getConfiguredAdminRole(email)) {
      const updatedUser = await this.usersService.updateRole(
        user.id,
        this.getConfiguredAdminRole(email),
      )

      if (updatedUser) {
        user = updatedUser
      }
    }

    if (!user) {
      throw new Error('Unable to resolve authenticated user.')
    }

    // ✅ Generate JWT
    const token = this.usersService.generateJwt(user)

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
}
