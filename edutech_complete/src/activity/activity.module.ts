import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CourseModule } from '../modules/module.entity'
import { featureFlags, whenEnabled } from '../config/feature-flags'
import { RedisModule } from '../redis/redis.module'
import { ExecutionModule } from '../execution/execution.module'
import { ActivityAdminController } from './activity-admin.controller'
import { ActivityController } from './activity.controller'
import { ActivitySubmission } from './activity-submission.entity'
import { Activity } from './activity.entity'
import { ActivityService } from './activity.service'

const controllers = [
  ActivityController,
  ...whenEnabled(featureFlags.enableAdmin, [ActivityAdminController]),
]

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivitySubmission, CourseModule]),
    RedisModule,
    ExecutionModule,
  ],
  controllers,
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
