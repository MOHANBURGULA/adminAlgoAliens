import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator'

export class UploadModuleDocumentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId!: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  label!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string
}
