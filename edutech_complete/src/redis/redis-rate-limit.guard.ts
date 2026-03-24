import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request, Response } from 'express'
import { RateLimitKeys } from './cache.helpers'
import { REDIS_RATE_LIMIT_KEY, RedisRateLimitOptions } from './redis-rate-limit.decorator'
import { RedisService } from './redis.service'

type RequestWithUser = Request & {
  user?: {
    id?: number
  }
}

@Injectable()
export class RedisRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const config = this.reflector.getAllAndOverride<RedisRateLimitOptions>(
      REDIS_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!config) {
      return true
    }

    const http = context.switchToHttp()
    const request = http.getRequest<RequestWithUser>()
    const response = http.getResponse<Response>()
    const identifier = this.getIdentifier(request)
    const key = RateLimitKeys.scope(config.keyPrefix, identifier)

    const current = await this.redisService.incr(key)
    if (current === null) {
      return true
    }

    if (current === 1) {
      await this.redisService.expire(key, config.windowSeconds)
    } else {
      const ttl = await this.redisService.ttl(key)
      if (ttl !== null && ttl < 0) {
        await this.redisService.expire(key, config.windowSeconds)
      }
    }

    if (current > config.limit) {
      const ttl = await this.redisService.ttl(key)
      if (ttl !== null && ttl > 0) {
        response.setHeader('Retry-After', ttl.toString())
      }

      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)
    }

    return true
  }

  private getIdentifier(request: RequestWithUser) {
    if (request.user?.id) {
      return `user:${request.user.id}`
    }

    const forwardedFor = request.headers['x-forwarded-for']
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return `ip:${forwardedFor.split(',')[0].trim()}`
    }

    return `ip:${request.ip || 'unknown'}`
  }
}
