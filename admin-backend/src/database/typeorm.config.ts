import { join } from 'path'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { TYPEORM_ENTITIES } from './typeorm.entities'

const MIGRATIONS_GLOB = [
  join(__dirname, '..', 'migrations', '*.{ts,js}').replace(/\\/g, '/'),
]

function readConfigValue(config: ConfigService | undefined, key: string) {
  return config?.get<string>(key)?.trim() || process.env[key]?.trim()
}

function readNumberConfig(
  config: ConfigService | undefined,
  key: string,
  fallback: number,
) {
  const value = readConfigValue(config, key)
  if (!value) {
    return fallback
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

function readBooleanConfig(
  config: ConfigService | undefined,
  key: string,
  fallback = false,
) {
  const value = readConfigValue(config, key)
  if (!value) {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function createSharedPostgresOptions(
  config?: ConfigService,
): Omit<PostgresConnectionOptions, 'entities' | 'migrations'> {
  const databaseUrl = readConfigValue(config, 'DATABASE_URL')
  const sslEnabled = readBooleanConfig(config, 'DB_SSL')

  const sharedOptions: Omit<PostgresConnectionOptions, 'entities' | 'migrations'> = {
    type: 'postgres',
    synchronize: readBooleanConfig(config, 'TYPEORM_SYNCHRONIZE'),
    logging: readBooleanConfig(config, 'TYPEORM_LOGGING'),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    uuidExtension: 'pgcrypto',
  }

  if (databaseUrl) {
    return {
      ...sharedOptions,
      url: databaseUrl,
    }
  }

  return {
    ...sharedOptions,
    host: readConfigValue(config, 'DB_HOST') || 'localhost',
    port: readNumberConfig(config, 'DB_PORT', 5432),
    username: readConfigValue(config, 'DB_USERNAME') || readConfigValue(config, 'DB_USER') || 'postgres',
    password: readConfigValue(config, 'DB_PASSWORD') || '',
    database: readConfigValue(config, 'DB_NAME') || readConfigValue(config, 'DATABASE_NAME') || 'postgres',
  }
}

export function createDataSourceOptions(config?: ConfigService): PostgresConnectionOptions {
  return {
    ...createSharedPostgresOptions(config),
    entities: TYPEORM_ENTITIES,
    migrations: MIGRATIONS_GLOB,
  }
}

export function createTypeOrmModuleOptions(config?: ConfigService): TypeOrmModuleOptions {
  return {
    ...createSharedPostgresOptions(config),
    autoLoadEntities: true,
    migrations: MIGRATIONS_GLOB,
    migrationsRun: readBooleanConfig(config, 'TYPEORM_MIGRATIONS_RUN'),
  }
}
