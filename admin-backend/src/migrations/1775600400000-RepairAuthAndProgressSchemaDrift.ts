import { MigrationInterface, QueryRunner } from 'typeorm'

export class RepairAuthAndProgressSchemaDrift1775600400000 implements MigrationInterface {
  name = 'RepairAuthAndProgressSchemaDrift1775600400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

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
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "feedback" text
    `)
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "rejectionCount" integer
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

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'module_progress'
            AND column_name = 'activityScore'
        ) THEN
          ALTER TABLE "module_progress"
          ALTER COLUMN "activityScore" TYPE double precision
          USING COALESCE("activityScore", 0)::double precision;

          UPDATE "module_progress"
          SET "activityScore" = 0
          WHERE "activityScore" IS NULL;

          ALTER TABLE "module_progress"
          ALTER COLUMN "activityScore" SET DEFAULT 0;

          ALTER TABLE "module_progress"
          ALTER COLUMN "activityScore" SET NOT NULL;
        ELSE
          ALTER TABLE "module_progress"
          ADD COLUMN "activityScore" double precision NOT NULL DEFAULT 0;
        END IF;
      END
      $$;
    `)

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'module_progress'
            AND column_name = 'videoUrl'
        ) THEN
          ALTER TABLE "module_progress"
          ALTER COLUMN "videoUrl" TYPE character varying
          USING "videoUrl"::character varying;
        ELSE
          ALTER TABLE "module_progress"
          ADD COLUMN "videoUrl" character varying;
        END IF;
      END
      $$;
    `)
  }

  public async down(): Promise<void> {
    // Intentionally left as a no-op to avoid destructive rollback on live data.
  }
}
