import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { ConnectionOptions } from 'bullmq'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: Redis
  private readonly host: string
  private readonly port: number
  private readonly reconnectThrottleMs = 10_000
  private readonly logThrottleMs = 30_000
  private lastReconnectAttemptAt = 0
  private lastLoggedIssueAt = 0
  private lastLoggedIssueMessage = ''
  private ready = false

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('REDIS_HOST') || 'localhost'
    this.port = Number(this.configService.get<string>('REDIS_PORT') || 6379)

    this.client = new Redis({
      host: this.host,
      port: this.port,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      retryStrategy: () => null,
    })

    this.client.on('connect', () => {
      this.ready = true
      this.logger.log('Redis connected')
    })

    this.client.on('ready', () => {
      this.ready = true
      this.logger.log('Redis ready')
    })

    this.client.on('error', (error) => {
      this.ready = false
      this.logRedisIssue('Redis error', error)
    })

    this.client.on('end', () => {
      this.ready = false
      this.logger.warn('Redis connection closed')
    })
  }

  async onModuleInit() {
    try {
      await this.client.connect()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Redis unavailable on startup. Continuing without cache: ${message}`)
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit()
    } catch {
      this.client.disconnect()
    }
  }

  getClient() {
    return this.client
  }

  isAvailable() {
    return this.ready || this.client.status === 'ready'
  }

  getBullMqConnection(): ConnectionOptions {
    return {
      host: this.host,
      port: this.port,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 5_000,
      retryStrategy: () => null,
    }
  }

  async getConfigValue(parameter: string) {
    if (!(await this.ensureConnection())) {
      return null
    }

    try {
      const response = await this.client.config('GET', parameter)
      if (Array.isArray(response) && response.length >= 2) {
        return response[1] || null
      }

      return null
    } catch (error) {
      this.logOperationError('CONFIG', parameter, error)
      return null
    }
  }

  async ping() {
    if (!(await this.ensureConnection())) {
      return false
    }

    try {
      return (await this.client.ping()) === 'PONG'
    } catch (error) {
      this.logRedisIssue('Redis ping failed', error)
      return false
    }
  }

  async get(key: string) {
    if (!(await this.ensureConnection())) {
      return null
    }

    try {
      return await this.client.get(key)
    } catch (error) {
      this.logOperationError('GET', key, error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (!(await this.ensureConnection())) {
      return false
    }

    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds)
        return true
      }

      await this.client.set(key, value)
      return true
    } catch (error) {
      this.logOperationError('SET', key, error)
      return false
    }
  }

  async del(...keys: string[]) {
    if (keys.length === 0) {
      return 0
    }

    if (!(await this.ensureConnection())) {
      return 0
    }

    try {
      return await this.client.del(...keys)
    } catch (error) {
      this.logOperationError('DEL', keys.join(', '), error)
      return 0
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cached = await this.get(key)
    if (!cached) {
      this.logger.log(`Cache MISS: ${key}`)
      return null
    }

    try {
      const parsed = this.parseCachedValue<T>(cached)
      this.logger.log(`Cache HIT: ${key}`)
      return parsed
    } catch (error) {
      this.logger.warn(`Invalid cached JSON for key "${key}". Deleting entry.`)
      await this.del(key)
      return null
    }
  }

  async setCache(key: string, value: unknown, ttlSeconds: number) {
    const saved = await this.set(key, JSON.stringify(value), ttlSeconds)
    if (saved) {
      this.logger.log(`Cache SET: ${key} TTL=${ttlSeconds}`)
    }

    return saved
  }

  async setIfAbsent(key: string, value: string, ttlSeconds?: number) {
    if (!(await this.ensureConnection())) {
      return false
    }

    try {
      const result = ttlSeconds
        ? await this.client.set(key, value, 'EX', ttlSeconds, 'NX')
        : await this.client.set(key, value, 'NX')

      return result === 'OK'
    } catch (error) {
      this.logOperationError('SETNX', key, error)
      return false
    }
  }

  async incr(key: string, incrementBy = 1) {
    if (!(await this.ensureConnection())) {
      return null
    }

    try {
      if (incrementBy === 1) {
        return await this.client.incr(key)
      }

      return await this.client.incrby(key, incrementBy)
    } catch (error) {
      this.logOperationError('INCR', key, error)
      return null
    }
  }

  async expire(key: string, ttlSeconds: number) {
    if (!(await this.ensureConnection())) {
      return false
    }

    try {
      return (await this.client.expire(key, ttlSeconds)) === 1
    } catch (error) {
      this.logOperationError('EXPIRE', key, error)
      return false
    }
  }

  async ttl(key: string) {
    if (!(await this.ensureConnection())) {
      return null
    }

    try {
      return await this.client.ttl(key)
    } catch (error) {
      this.logOperationError('TTL', key, error)
      return null
    }
  }

  private async ensureConnection() {
    if (this.client.status === 'ready' || this.client.status === 'connect') {
      return true
    }

    if (
      this.client.status === 'connecting' ||
      this.client.status === 'reconnecting'
    ) {
      return false
    }

    const now = Date.now()
    if (now - this.lastReconnectAttemptAt < this.reconnectThrottleMs) {
      return false
    }

    this.lastReconnectAttemptAt = now

    try {
      await this.client.connect()
      return true
    } catch (error) {
      this.logRedisIssue('Redis reconnect skipped', error)
      return false
    }
  }

  private logOperationError(operation: string, key: string, error: unknown) {
    const message = this.describeError(error)
    this.logger.warn(`Redis ${operation} failed for key "${key}": ${message}`)
  }

  private parseCachedValue<T>(cached: string): T {
    const parsed = JSON.parse(cached)

    if (typeof parsed === 'string') {
      const trimmed = parsed.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        this.logger.warn('Detected double-encoded cached JSON. Decoding nested payload.')
        return JSON.parse(trimmed) as T
      }
    }

    return parsed as T
  }

  private logRedisIssue(context: string, error: unknown) {
    const message = `${context}: ${this.describeError(error)}`
    const now = Date.now()

    if (
      message === this.lastLoggedIssueMessage &&
      now - this.lastLoggedIssueAt < this.logThrottleMs
    ) {
      return
    }

    this.lastLoggedIssueMessage = message
    this.lastLoggedIssueAt = now
    this.logger.warn(message)
  }

  private describeError(error: unknown) {
    if (error instanceof Error) {
      if (error.message?.trim()) {
        return error.message.trim()
      }

      if (error.name?.trim()) {
        return error.name.trim()
      }
    }

    const value = String(error ?? '').trim()
    return value || 'Unknown Redis connection error'
  }
}
