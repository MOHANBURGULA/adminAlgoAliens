import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProgressFields1775585433276 implements MigrationInterface {
    name = 'AddProgressFields1775585433276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "theoryCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "activityScore" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "activityPassed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "videoUploaded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "videoUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "moduleCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_activities" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "module_activities" ALTER COLUMN "config" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "moduleCompleted"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "videoUrl"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "videoUploaded"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "activityPassed"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "activityScore"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "theoryCompleted"`);
    }

}
