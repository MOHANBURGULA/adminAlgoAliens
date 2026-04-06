import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CoursesModule } from './courses/courses.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { ProjectsModule } from './projects/projects.module'
import { VideosModule } from './videos/videos.module'
import { CertificatesModule } from './certificates/certificates.module'
import { ModulesModule } from './modules/modules.module'
import { QuestionsModule } from './questions/questions.module'
import { QuizAttemptsModule } from './quiz-attempts/quiz-attempts.module'
import { FinalQuizModule } from './final-quiz/final-quiz.module'
import { EvaluationModule } from './evaluation/evaluation.module'
import { RedisModule } from './redis/redis.module'
import { TheoryModule } from './theory/theory.module'
import { DatabaseSchemaValidatorService } from './database/database-schema-validator.service'
import { createTypeOrmModuleOptions } from './database/typeorm.config'

// UPDATED — Changes applied:
//   #9  : Course entity extended (description, keywords, categoryId) — picked up via autoLoadEntities
//   #11 : CourseCategory entity registered inside CoursesModule — picked up via autoLoadEntities
//   #3  : Video entity extended (feedback, rejectionCount, courseId) — picked up via autoLoadEntities
//   #13 : EvaluationModule no longer exposes user-facing routes
//   No new top-level module needed — all new entities registered inside their feature modules
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createTypeOrmModuleOptions(config),
    }),

    AuthModule,
    UsersModule,
    CoursesModule,        // also registers CourseCategory entity (Change #11)
    EnrollmentsModule,
    ProjectsModule,
    VideosModule,
    CertificatesModule,
    ModulesModule,
    QuestionsModule,
    QuizAttemptsModule,
    FinalQuizModule,
    EvaluationModule,     // no longer registers EvaluationController (Change #13)
    TheoryModule,
    RedisModule,
    AdminModule,          // registers CourseCategory in admin context (Change #11)
  ],
  providers: [DatabaseSchemaValidatorService],
})
export class AppModule {}
