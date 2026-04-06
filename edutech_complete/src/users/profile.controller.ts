import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RedisRateLimit } from '../redis/redis-rate-limit.decorator';
import { RedisRateLimitGuard } from '../redis/redis-rate-limit.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UsersService } from './users.service';

@Controller('api')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: { user: { id: number } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RedisRateLimitGuard)
  @RedisRateLimit({
    keyPrefix: 'users:onboarding',
    limit: 5,
    windowSeconds: 60,
  })
  @Post('onboarding')
  completeOnboarding(
    @Req() req: { user: { id: number } },
    @Body() body: CompleteOnboardingDto,
  ) {
    return this.usersService.completeOnboarding(req.user.id, body);
  }
}
