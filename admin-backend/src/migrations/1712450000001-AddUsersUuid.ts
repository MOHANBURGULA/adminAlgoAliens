import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUsersUuid1712450000001 implements MigrationInterface {
  name = 'AddUsersUuid1712450000001'

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
  }

  public async down(): Promise<void> {
    // Intentionally left as a no-op to avoid destructive rollback.
  }
}
