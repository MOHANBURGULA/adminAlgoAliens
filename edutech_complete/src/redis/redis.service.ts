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

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('REDIS_HOST') || 'localhost'
    this.port = Number(this.configService.get<string>('REDIS_PORT') || 6379)

    this.client = new Redis({
      host: this.host,
      port: this.port,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })

    this.client.on('connect', () => {
      this.logger.log('Redis connected')
    })

    this.client.on('ready', () => {
      this.logger.log('Redis ready')
    })

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`, error.stack)
    })

    this.client.on('end', () => {
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

  getBullMqConnection(): ConnectionOptions {
    return {
      host: this.host,
      port: this.port,
      maxRetriesPerRequest: null,
    }
  }

  async get(key: string) {
    try {
      return await this.client.get(key)
    } catch (error) {
      this.logOperationError('GET', key, error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
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
      return null
    }

    try {
      return JSON.parse(cached) as T
    } catch (error) {
      this.logger.warn(`Invalid cached JSON for key "${key}". Deleting entry.`)
      await this.del(key)
      return null
    }
  }

  async setCache(key: string, value: unknown, ttlSeconds: number) {
    return this.set(key, JSON.stringify(value), ttlSeconds)
  }

  private logOperationError(operation: string, key: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    this.logger.warn(`Redis ${operation} failed for key "${key}": ${message}`)
  }
}
