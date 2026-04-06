import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { DataSource } from 'typeorm'

type ColumnSnapshot = {
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: 'YES' | 'NO'
}

@Injectable()
export class DatabaseSchemaValidatorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSchemaValidatorService.name)

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    if (!this.dataSource.isInitialized) {
      return
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      const tables = (await queryRunner.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `)) as Array<{ table_name: string }>
      const columns = (await queryRunner.query(`
        SELECT table_name, column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
      `)) as Array<ColumnSnapshot & { table_name: string }>

      const tableSet = new Set(tables.map((table) => table.table_name))
      const columnsByTable = new Map<string, Map<string, ColumnSnapshot>>()

      for (const column of columns) {
        if (!columnsByTable.has(column.table_name)) {
          columnsByTable.set(column.table_name, new Map())
        }

        columnsByTable.get(column.table_name)!.set(column.column_name, column)
      }

      for (const metadata of this.dataSource.entityMetadatas) {
        const tableName = metadata.tableName

        if (!tableSet.has(tableName)) {
          this.logger.warn(
            `Schema validation warning: missing table "${tableName}" for entity ${metadata.name}.`,
          )
          continue
        }

        const tableColumns = columnsByTable.get(tableName) ?? new Map<string, ColumnSnapshot>()

        for (const column of metadata.columns) {
          const actualColumn = tableColumns.get(column.databaseName)

          if (!actualColumn) {
            this.logger.warn(
              `Schema validation warning: missing column "${tableName}.${column.databaseName}".`,
            )
            continue
          }

          const expectedType = this.normalizeExpectedType(column.type, column.isArray)
          const actualType = this.normalizeActualType(actualColumn)

          if (expectedType && actualType && expectedType !== actualType) {
            this.logger.warn(
              `Schema validation warning: "${tableName}.${column.databaseName}" expected ${expectedType} but found ${actualType}.`,
            )
          }

          const expectedNullable = column.isNullable
          const actualNullable = actualColumn.is_nullable === 'YES'

          if (expectedNullable !== actualNullable) {
            this.logger.warn(
              `Schema validation warning: "${tableName}.${column.databaseName}" nullable mismatch (entity=${expectedNullable}, db=${actualNullable}).`,
            )
          }
        }
      }

      this.logger.log('Database schema validation completed')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Database schema validation skipped: ${message}`)
    } finally {
      await queryRunner.release()
    }
  }

  private normalizeActualType(column: ColumnSnapshot) {
    switch (column.data_type) {
      case 'ARRAY':
        return 'array'
      case 'boolean':
        return 'boolean'
      case 'character varying':
        return 'varchar'
      case 'double precision':
      case 'real':
        return 'float'
      case 'integer':
        return 'int'
      case 'jsonb':
        return 'jsonb'
      case 'text':
        return 'text'
      case 'timestamp without time zone':
      case 'timestamp with time zone':
        return 'timestamp'
      case 'uuid':
        return 'uuid'
      default:
        return column.udt_name || column.data_type
    }
  }

  private normalizeExpectedType(type: unknown, isArray = false) {
    if (isArray) return 'array'
    if (type === Number) return 'int'
    if (type === String) return 'varchar'
    if (type === Boolean) return 'boolean'
    if (type === Date) return 'timestamp'

    const value = String(type).toLowerCase()
    if (value.includes('jsonb')) return 'jsonb'
    if (value.includes('simple-array')) return 'text'
    if (value.includes('varchar')) return 'varchar'
    if (value.includes('character varying')) return 'varchar'
    if (value.includes('uuid')) return 'uuid'
    if (value.includes('timestamp')) return 'timestamp'
    if (value.includes('int')) return 'int'
    if (value.includes('float') || value.includes('double') || value.includes('real')) return 'float'
    if (value.includes('bool')) return 'boolean'
    if (value.includes('text')) return 'text'

    return value || null
  }
}
