import { Type } from 'class-transformer'
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export class SubmitActivityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  activityId!: number

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  sourceCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  language?: string

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  answer?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  selectedOptionIndex?: number
}
