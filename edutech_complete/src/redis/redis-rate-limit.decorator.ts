import { SetMetadata } from '@nestjs/common'

export const REDIS_RATE_LIMIT_KEY = 'redis-rate-limit'

export type RedisRateLimitOptions = {
  keyPrefix: string
  limit: number
  windowSeconds: number
}

export const RedisRateLimit = (options: RedisRateLimitOptions) =>
  SetMetadata(REDIS_RATE_LIMIT_KEY, options)
