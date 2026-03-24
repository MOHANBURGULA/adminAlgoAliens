import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisMetricsService } from './redis-metrics.service'
import { RedisRateLimitGuard } from './redis-rate-limit.guard'
import { RedisService } from './redis.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisMetricsService, RedisRateLimitGuard],
  exports: [RedisService, RedisMetricsService, RedisRateLimitGuard],
})
export class RedisModule {}
