export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  role: string;
};

export type GoogleLoginPayload = {
  email?: string;
  name?: string;
};

export type UpdateUserPayload = {
  name?: string;
  password?: string;
};

export type CompleteOnboardingPayload = {
  role: string;
  career_goal: string;
  skill_domains: string[];
  skillLevel: string;
  coding_experience: boolean;
  weekly_hours: string;
  target_timeline: string;
  onboarding_completed?: boolean;
};

export type UpdateLearningProfilePayload = {
  skillLevel?: string;
  goal?: string;
  interests?: string[];
  career_goal?: string;
  skill_domains?: string[];
};

export type UserProfileResponse = {
  userId: number;
  role: string;
  career_goal: string;
  skill_domains: string[];
  skillLevel: string;
  coding_experience: boolean | null;
  weekly_hours: string;
  target_timeline: string;
  onboarding_completed: boolean;
  goal: string;
  interests: string[];
};
