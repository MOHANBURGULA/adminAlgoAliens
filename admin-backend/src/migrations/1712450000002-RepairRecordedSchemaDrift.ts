import { MigrationInterface, QueryRunner } from 'typeorm'

export class RepairRecordedSchemaDrift1712450000002 implements MigrationInterface {
  name = 'RepairRecordedSchemaDrift1712450000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "description" text
    `)
    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "keywords" text
    `)
    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "categoryId" uuid
    `)

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "uuid" uuid DEFAULT gen_random_uuid()
    `)
    await queryRunner.query(`
      UPDATE "users"
      SET "uuid" = gen_random_uuid()
      WHERE "uuid" IS NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "uuid" SET DEFAULT gen_random_uuid()
    `)
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "uuid" SET NOT NULL
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_uuid"
      ON "users" ("uuid")
    `)

    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "feedback" text
    `)
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "rejectionCount" integer DEFAULT 0
    `)
    await queryRunner.query(`
      UPDATE "videos"
      SET "rejectionCount" = 0
      WHERE "rejectionCount" IS NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "rejectionCount" SET DEFAULT 0
    `)
    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "rejectionCount" SET NOT NULL
    `)
  }

  public async down(): Promise<void> {
    // Intentionally left as a no-op to avoid destructive rollback on live data.
  }
}
