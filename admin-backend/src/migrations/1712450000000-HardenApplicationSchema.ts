import { MigrationInterface, QueryRunner } from 'typeorm'

export class HardenApplicationSchema1712450000000 implements MigrationInterface {
  name = 'HardenApplicationSchema1712450000000'

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
      CREATE TABLE IF NOT EXISTS "course_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_course_categories_name"
      ON "course_categories" ("name")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "module_activities" (
        "id" SERIAL PRIMARY KEY,
        "moduleId" integer NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "activityType" character varying NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT 1,
        "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_module_activities_moduleId"
      ON "module_activities" ("moduleId")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "theory_resources" (
        "id" SERIAL PRIMARY KEY,
        "moduleId" integer NOT NULL,
        "title" character varying NOT NULL,
        "fileUrl" text NOT NULL,
        "fileType" character varying(10) NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_theory_resources_moduleId"
      ON "theory_resources" ("moduleId")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "theory_progress" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "moduleId" integer NOT NULL,
        "scrollPosition" double precision NOT NULL DEFAULT 0,
        "percentageCompleted" double precision NOT NULL DEFAULT 0,
        "lastPage" integer,
        "bookmarkScrollPosition" double precision,
        "bookmarkPage" integer,
        "completed" boolean NOT NULL DEFAULT false,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_theory_progress_user_module"
      ON "theory_progress" ("userId", "moduleId")
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_theory_progress_moduleId"
      ON "theory_progress" ("moduleId")
    `)

    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "courseId" integer
    `)
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "feedback" text
    `)
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "rejectionCount" integer NOT NULL DEFAULT 0
    `)

    await queryRunner.query(`
      ALTER TABLE "project"
      ADD COLUMN IF NOT EXISTS "feedback" text
    `)

    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN IF NOT EXISTS "expectedAnswer" text
    `)
  }

  public async down(): Promise<void> {
    // Intentionally left as a no-op to avoid destructive schema/data rollback in production.
  }
}
