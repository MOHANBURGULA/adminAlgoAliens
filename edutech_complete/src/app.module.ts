import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

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
import { AdminModule } from './admin/admin.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { LeaderboardModule } from './leaderboard/leaderboard.module'
import { MailModule } from './mail/mail.module'
import { RedisModule } from './redis/redis.module'
import { ActivityModule } from './activity/activity.module'
import { ExecutionModule } from './execution/execution.module'
import { PdfModule } from './pdf/pdf.module'
import { featureFlags, whenEnabled } from './config/feature-flags'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('DB_HOST')     || 'localhost',
        port:     config.get<number>('DB_PORT')     || 5432,
        username: config.get<string>('DB_USERNAME') || 'postgres',
        password: config.get<string>('DB_PASSWORD') || 'postgres',
        database: config.get<string>('DB_NAME')     || 'Edtech',
        autoLoadEntities: true,
        synchronize: true
      })
    }),

    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ProjectsModule,
    VideosModule,
    CertificatesModule,
    ModulesModule,
    QuestionsModule,
    QuizAttemptsModule,
    FinalQuizModule,
    EvaluationModule,
    ...whenEnabled(featureFlags.enableAdmin, [AdminModule]),
    DashboardModule,
    LeaderboardModule,
    MailModule,
    ExecutionModule,
    PdfModule,
    ActivityModule,
  ],
})
export class AppModule {}
