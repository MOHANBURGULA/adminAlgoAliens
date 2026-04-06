import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UploadTheoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsOptional()
  @IsString()
  title?: string
}

export class SaveTheoryProgressDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsOptional()
  @Type(() => Number)
  lastPage?: number | null

  @IsOptional()
  @Type(() => Number)
  percentageCompleted?: number

  @IsOptional()
  @Type(() => Number)
  scrollPosition?: number

  @IsOptional()
  @Type(() => Number)
  bookmarkScrollPosition?: number | null

  @IsOptional()
  @Type(() => Number)
  bookmarkPage?: number | null

  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean
}
