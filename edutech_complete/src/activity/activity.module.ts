import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CourseModule } from '../modules/module.entity'
import { RedisModule } from '../redis/redis.module'
import { ExecutionModule } from '../execution/execution.module'
import { ActivityController } from './activity.controller'
import { ActivitySubmission } from './activity-submission.entity'
import { Activity } from './activity.entity'
import { ActivityService } from './activity.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivitySubmission, CourseModule]),
    RedisModule,
    ExecutionModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
