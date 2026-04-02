import { Type } from 'class-transformer'
import { IsEnum, IsInt, Min, ValidateNested } from 'class-validator'
import { ActivityType } from '../activity-type.enum'
import { ActivityContentDto } from './activity-content.dto'

export class CreateActivityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsEnum(ActivityType)
  activityType!: ActivityType

  @ValidateNested()
  @Type(() => ActivityContentDto)
  content!: ActivityContentDto
}
