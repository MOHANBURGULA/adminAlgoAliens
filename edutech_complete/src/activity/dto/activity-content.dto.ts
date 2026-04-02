import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

export class ActivityTestCaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  input?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  output?: string

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean
}

export class ActivityQuizChoiceDto {
  @IsString()
  @MaxLength(500)
  label!: string
}

export class ActivityContentDto {
  @IsString()
  @MaxLength(5000)
  description!: string

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  starterCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  expectedOutput?: string

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  sqlSchema?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanation?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  language?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ActivityTestCaseDto)
  testCases?: ActivityTestCaseDto[]

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ActivityQuizChoiceDto)
  choices?: ActivityQuizChoiceDto[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctChoiceIndex?: number
}
