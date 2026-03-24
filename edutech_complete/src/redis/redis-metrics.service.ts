import { Injectable } from '@nestjs/common'
import { METRIC_TTL_SECONDS, MetricKeys } from './cache.helpers'
import { RedisService } from './redis.service'

@Injectable()
export class RedisMetricsService {
  constructor(private readonly redisService: RedisService) {}

  async increment(metricName: string, amount = 1) {
    const key = MetricKeys.daily(this.getCurrentDateKey(), metricName)
    const value = await this.redisService.incr(key, amount)

    if (value === null) {
      return null
    }

    const ttl = await this.redisService.ttl(key)
    if (ttl === null || ttl < 0) {
      await this.redisService.expire(key, METRIC_TTL_SECONDS.dailyMetric)
    }

    return value
  }

  private getCurrentDateKey() {
    return new Date().toISOString().slice(0, 10)
  }
}
