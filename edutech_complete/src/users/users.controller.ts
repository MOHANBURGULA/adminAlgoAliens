import { BadRequestException, Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { MetricNames } from '../redis/cache.helpers'
import { RedisMetricsService } from '../redis/redis-metrics.service'
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator'
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard'
import type { GoogleLoginPayload, UpdateUserPayload, UserProfilePayload } from './users.types'
import { UsersService } from './users.service'

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private readonly redisMetricsService: RedisMetricsService,
  ) {}

  private serializeUser(user: {
    id: number
    name: string
    email: string
    role: string
    createdAt?: Date
  } | null) {
    if (!user) {
      return user
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }
  }

  private validateGoogleLoginBody(body: GoogleLoginPayload) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!email || !name) {
      throw new BadRequestException('Email and name are required for Google login')
    }

    return { email, name }
  }

  @UseGuards(RedisRateLimitGuard)
  @RedisRateLimit({ keyPrefix: 'users:google-login', limit: 10, windowSeconds: 60 })
  @Post('google-login')
  async googleLogin(@Body() body: GoogleLoginPayload) {
    const { email, name } = this.validateGoogleLoginBody(body)
    let isNewUser = false

    let user = await this.usersService.findByEmail(email)

    if (!user) {
      isNewUser = true
      user = await this.usersService.create({
        email,
        name,
        password: 'GOOGLE_AUTH',
        role: 'student',
      })
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
      user: this.serializeUser(user),
      isNewUser,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: { user: { id: number } }) {
    const user = await this.usersService.findById(req.user.id)
    return this.serializeUser(user)
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(
    @Req() req: { user: { id: number } },
    @Body() body: UpdateUserPayload,
  ) {
    const user = await this.usersService.updateUser(req.user.id, {
      name: body?.name,
      password: body?.password,
    })
    return this.serializeUser(user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  createProfile(
    @Req() req: { user: { id: number } },
    @Body() body: Partial<UserProfilePayload>,
  ) {
    return this.usersService.createProfile(req.user.id, body)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: { user: { id: number } }) {
    return this.usersService.getProfile(req.user.id)
  }
}
