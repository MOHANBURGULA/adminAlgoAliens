import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const ONBOARDING_ROLES = ['Student', 'Job Seeker', 'Professional'] as const;
const CAREER_GOALS = [
  'Placements',
  'Internship',
  'Certification',
  'Career Switch',
] as const;
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const WEEKLY_HOURS = ['<5', '5-10', '10-20', '20+'] as const;
const TARGET_TIMELINES = [
  '1 month',
  '3 months',
  '6 months',
  'Flexible',
] as const;

export class CompleteOnboardingDto {
  @IsIn(ONBOARDING_ROLES)
  role!: string;

  @IsIn(CAREER_GOALS)
  career_goal!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  skill_domains!: string[];

  @IsIn(SKILL_LEVELS)
  skillLevel!: string;

  @IsBoolean()
  coding_experience!: boolean;

  @IsIn(WEEKLY_HOURS)
  weekly_hours!: string;

  @IsIn(TARGET_TIMELINES)
  target_timeline!: string;

  @IsOptional()
  @IsBoolean()
  onboarding_completed?: boolean;
}
