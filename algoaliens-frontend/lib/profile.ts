export type UserProfileData = {
  userId: number
  role: string
  career_goal: string
  skill_domains: string[]
  skillLevel: string
  coding_experience: boolean | null
  weekly_hours: string
  target_timeline: string
  onboarding_completed: boolean
  goal: string
  interests: string[]
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeSkillLevel(value: unknown) {
  const normalized = normalizeString(value).toLowerCase()

  switch (normalized) {
    case "beginner":
      return "Beginner"
    case "intermediate":
      return "Intermediate"
    case "advanced":
      return "Advanced"
    default:
      return normalizeString(value)
  }
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  )
}

export function normalizeUserProfile(
  payload: Partial<UserProfileData> | null | undefined,
): UserProfileData {
  const skillDomains = normalizeStringArray(payload?.skill_domains ?? payload?.interests)
  const careerGoal = normalizeString(payload?.career_goal ?? payload?.goal)

  return {
    userId: typeof payload?.userId === "number" ? payload.userId : 0,
    role: normalizeString(payload?.role),
    career_goal: careerGoal,
    skill_domains: skillDomains,
    skillLevel: normalizeSkillLevel(payload?.skillLevel),
    coding_experience:
      typeof payload?.coding_experience === "boolean" ? payload.coding_experience : null,
    weekly_hours: normalizeString(payload?.weekly_hours),
    target_timeline: normalizeString(payload?.target_timeline),
    onboarding_completed: Boolean(payload?.onboarding_completed),
    goal: careerGoal,
    interests: skillDomains,
  }
}
