import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export class UpdateLearningProfileDto {
  @IsOptional()
  @IsIn(SKILL_LEVELS)
  skillLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  career_goal?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  skill_domains?: string[];
}
