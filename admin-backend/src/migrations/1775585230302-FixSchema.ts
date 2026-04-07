import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSchema1775585230302 implements MigrationInterface {
    name = 'FixSchema1775585230302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_course_categories_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_module_activities_moduleId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_theory_progress_user_module"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_theory_progress_moduleId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_theory_resources_moduleId"`);
        await queryRunner.query(`ALTER TABLE "module_documents" DROP COLUMN "storageKey"`);
        await queryRunner.query(`ALTER TABLE "module_documents" DROP COLUMN "pageCount"`);
        await queryRunner.query(`ALTER TABLE "module_documents" DROP COLUMN "parsedContent"`);
        await queryRunner.query(`ALTER TABLE "module_documents" DROP COLUMN "parseStatus"`);
        await queryRunner.query(`ALTER TABLE "module_documents" DROP COLUMN "parseError"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "theoryCompleted"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "activityScore"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "activityPassed"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "videoUploaded"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "moduleCompleted"`);
        await queryRunner.query(`ALTER TABLE "module_progress" DROP COLUMN "videoUrl"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "coding_experience"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "onboarding_completed"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "career_goal"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "skill_domains"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "weekly_hours"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "target_timeline"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "moduleId"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "moduleNumber"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "fileSizeBytes"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "fileKey"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "contentType"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "keywords" text`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "uuid" uuid NOT NULL DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_951b8f1dfc94ac1d0301a14b7e1" UNIQUE ("uuid")`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "feedback" text`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "rejectionCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "module_activities" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "description" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "description" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "module_activities" ALTER COLUMN "config" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "rejectionCount"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "feedback"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_951b8f1dfc94ac1d0301a14b7e1"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "uuid"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "contentType" character varying`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "fileKey" text`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "fileSizeBytes" bigint`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "moduleNumber" integer`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "moduleId" integer`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "target_timeline" character varying DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "weekly_hours" character varying DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "skill_domains" text array DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "career_goal" character varying DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "role" character varying DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "onboarding_completed" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "coding_experience" boolean`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "videoUrl" text`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "moduleCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "videoUploaded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "activityPassed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "activityScore" integer DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "module_progress" ADD "theoryCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "module_documents" ADD "parseError" text`);
        await queryRunner.query(`ALTER TABLE "module_documents" ADD "parseStatus" character varying DEFAULT 'completed'`);
        await queryRunner.query(`ALTER TABLE "module_documents" ADD "parsedContent" jsonb`);
        await queryRunner.query(`ALTER TABLE "module_documents" ADD "pageCount" integer`);
        await queryRunner.query(`ALTER TABLE "module_documents" ADD "storageKey" jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_theory_resources_moduleId" ON "theory_resources" ("moduleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_theory_progress_moduleId" ON "theory_progress" ("moduleId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_theory_progress_user_module" ON "theory_progress" ("userId", "moduleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_module_activities_moduleId" ON "module_activities" ("moduleId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_course_categories_name" ON "course_categories" ("name") `);
    }

}
