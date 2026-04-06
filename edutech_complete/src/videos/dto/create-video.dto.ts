import { Type } from 'class-transformer'
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateVideoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId!: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  videoUrl?: string
}
