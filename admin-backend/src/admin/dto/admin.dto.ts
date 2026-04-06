import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsIn,
} from 'class-validator'

export class ReleaseCertificateDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId!: number
}

export class UpdateStatusDto {
  @IsString()
  status!: string

  @IsOptional()
  @IsString()
  feedback?: string
}

export class CreateModuleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId!: number

  @IsString()
  title!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex!: number
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex?: number
}

export class CreateModuleDocumentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsString()
  label!: string

  @IsString()
  title!: string

  @IsString()
  fileUrl!: string
}

export class UpdateModuleDocumentDto {
  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  fileUrl?: string
}

export class CreateModuleActivityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @IsIn(['sql_debugging', 'coding', 'analysis', 'quiz'])
  activityType!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex?: number

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}

export class UpdateModuleActivityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId?: number

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsIn(['sql_debugging', 'coding', 'analysis', 'quiz'])
  activityType?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex?: number

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}

export class ExecuteCodeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  languageId?: number

  @IsOptional()
  @IsString()
  languageKey?: string

  @IsOptional()
  @IsString()
  languageName?: string

  @IsString()
  sourceCode!: string

  @IsOptional()
  @IsString()
  stdin?: string

  @IsOptional()
  @IsString()
  expectedOutput?: string
}

export class CreateCourseDto {
  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  difficulty?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[]

  @IsOptional()
  @IsUUID()
  categoryId?: string
}

export class UpdateCourseDto extends CreateCourseDto {}

export class CreateCategoryDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string
}

export class CreateQuestionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsString()
  type!: string

  @IsString()
  questionText!: string

  @IsArray()
  @IsString({ each: true })
  options!: string[]

  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctOptionIndex!: number

  @IsOptional()
  @IsString()
  expectedAnswer?: string
}

export class UpdateQuestionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId?: number

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  questionText?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctOptionIndex?: number

  @IsOptional()
  @IsString()
  expectedAnswer?: string
}
