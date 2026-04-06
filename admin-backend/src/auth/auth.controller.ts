import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private readonly redisMetricsService: RedisMetricsService,
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

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'auth:signup', limit: 10, windowSeconds: 60 })
  @Post('signup')
  signup(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.signup(body)
  }

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'auth:login', limit: 10, windowSeconds: 60 })
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

  @UseGuards(JwtAuthGuard, RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'auth:change-password', limit: 5, windowSeconds: 600 })
  @Post('change-password')
  changePassword(@Req() req: { user: { id: number } }) {
    return this.authService.changePassword(req.user.id)
  }

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'auth:reset-password', limit: 5, windowSeconds: 600 })
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword)
  }

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'auth:google', limit: 10, windowSeconds: 60 })
  @Post('google')
  async googleLogin(@Body() body: { email: string; name: string }) {
    const { email, name } = body
    let isNewUser = false

    let user = await this.usersService.findByEmail(email)

    if (!user) {
      isNewUser = true
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

    const token = this.usersService.generateJwt(user)

    await Promise.all([
      this.redisMetricsService.increment(MetricNames.authLoginSuccess),
      isNewUser
        ? this.redisMetricsService.increment(MetricNames.signupSuccess)
        : Promise.resolve(null),
    ])

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
