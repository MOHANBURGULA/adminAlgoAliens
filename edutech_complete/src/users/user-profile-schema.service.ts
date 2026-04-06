import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

type MissingColumnDefinition = {
  name: string;
  definition: string;
};

@Injectable()
export class UserProfileSchemaService implements OnModuleInit {
  private readonly logger = new Logger(UserProfileSchemaService.name);
  private readonly tableName = 'user_profiles';
  private readonly requiredColumns: MissingColumnDefinition[] = [
    {
      name: 'role',
      definition: `"role" character varying DEFAULT '' NULL`,
    },
    {
      name: 'career_goal',
      definition: `"career_goal" character varying DEFAULT '' NULL`,
    },
    {
      name: 'skill_domains',
      definition: `"skill_domains" text[] DEFAULT '{}'::text[] NULL`,
    },
    {
      name: 'coding_experience',
      definition: `"coding_experience" boolean NULL`,
    },
    {
      name: 'weekly_hours',
      definition: `"weekly_hours" character varying DEFAULT '' NULL`,
    },
    {
      name: 'target_timeline',
      definition: `"target_timeline" character varying DEFAULT '' NULL`,
    },
    {
      name: 'onboarding_completed',
      definition: `"onboarding_completed" boolean DEFAULT false NULL`,
    },
  ];

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.options.type !== 'postgres') {
      return;
    }

    try {
      const existingColumns = await this.getExistingColumns();
      const missingColumns = this.requiredColumns.filter(
        ({ name }) => !existingColumns.has(name),
      );

      if (missingColumns.length === 0) {
        return;
      }

      for (const column of missingColumns) {
        await this.dataSource.query(
          `ALTER TABLE "${this.tableName}" ADD COLUMN IF NOT EXISTS ${column.definition};`,
        );
      }

      this.logger.warn(
        `Patched legacy "${this.tableName}" schema with columns: ${missingColumns
          .map(({ name }) => name)
          .join(', ')}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to repair "${this.tableName}" schema: ${message}`,
      );
      throw error;
    }
  }

  private async getExistingColumns() {
    const rows = await this.dataSource.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `,
      [this.tableName],
    );

    return new Set(
      rows
        .map((row: { column_name?: unknown }) => row.column_name)
        .filter((columnName: unknown): columnName is string =>
          typeof columnName === 'string',
        ),
    );
  }
}
