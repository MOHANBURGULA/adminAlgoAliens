import { normalizeUserProfile, type UserProfileData } from "./profile"

export const ONBOARDING_DRAFT_STORAGE_KEY = "onboarding-draft"

export const ROLE_OPTIONS = [
  {
    value: "Student",
    label: "Student",
    description: "Build fundamentals, projects, and placement readiness while studying.",
  },
  {
    value: "Job Seeker",
    label: "Job Seeker",
    description: "Focus on interview prep, portfolio work, and role-specific momentum.",
  },
  {
    value: "Professional",
    label: "Professional",
    description: "Upskill around promotion goals, certifications, or a sharper technical edge.",
  },
] as const

export const CAREER_GOAL_OPTIONS = [
  {
    value: "Placements",
    label: "Placements",
    description: "Prioritize interview-ready learning paths for campus and early-career roles.",
  },
  {
    value: "Internship",
    label: "Internship",
    description: "Balance practical skills, project depth, and recruiter visibility.",
  },
  {
    value: "Certification",
    label: "Certification",
    description: "Move through structured learning with milestone-driven completion goals.",
  },
  {
    value: "Career Switch",
    label: "Career Switch",
    description: "Build confidence in a new domain with deliberate ramp-up and guided practice.",
  },
] as const

export const SKILL_DOMAIN_OPTIONS = [
  {
    value: "Data Structures & Algorithms",
    label: "Data Structures & Algorithms",
    description: "Sharpen problem solving and interview performance.",
  },
  {
    value: "Web Development",
    label: "Web Development",
    description: "Build modern frontend and backend applications.",
  },
  {
    value: "AI / Machine Learning",
    label: "AI / Machine Learning",
    description: "Learn model thinking, applied AI, and practical workflows.",
  },
  {
    value: "Cloud Computing",
    label: "Cloud Computing",
    description: "Understand deployment, infrastructure, and scalable systems.",
  },
  {
    value: "System Design",
    label: "System Design",
    description: "Level up architecture and decision-making for larger products.",
  },
  {
    value: "Cybersecurity",
    label: "Cybersecurity",
    description: "Explore secure engineering and defensive fundamentals.",
  },
] as const

export const SKILL_LEVEL_OPTIONS = [
  {
    value: "Beginner",
    label: "Beginner",
    description: "You want a guided path with strong foundations and lighter assumptions.",
  },
  {
    value: "Intermediate",
    label: "Intermediate",
    description: "You know the basics and want stronger consistency and project depth.",
  },
  {
    value: "Advanced",
    label: "Advanced",
    description: "You want higher-challenge practice, sharper specialization, and speed.",
  },
] as const

export const CODING_EXPERIENCE_OPTIONS = [
  {
    value: true,
    label: "Yes",
    description: "You have already written code in classes, projects, or work.",
  },
  {
    value: false,
    label: "No",
    description: "You are just getting started and want a beginner-friendly path.",
  },
] as const

export const WEEKLY_HOURS_OPTIONS = [
  {
    value: "<5",
    label: "Under 5 hrs",
    description: "A lighter pace for steady progress around a packed schedule.",
  },
  {
    value: "5-10",
    label: "5-10 hrs",
    description: "A balanced weekly rhythm that works well for most learners.",
  },
  {
    value: "10-20",
    label: "10-20 hrs",
    description: "A focused pace for faster progress and more project time.",
  },
  {
    value: "20+",
    label: "20+ hrs",
    description: "An intensive track built for high momentum and shorter timelines.",
  },
] as const

export const TARGET_TIMELINE_OPTIONS = [
  {
    value: "1 month",
    label: "1 month",
    description: "Move fast with concentrated effort and short-term milestones.",
  },
  {
    value: "3 months",
    label: "3 months",
    description: "A strong middle ground for depth without rushing.",
  },
  {
    value: "6 months",
    label: "6 months",
    description: "Build confidence steadily with room for revision and practice.",
  },
  {
    value: "Flexible",
    label: "Flexible",
    description: "Prefer a personalized pace that adapts around your life.",
  },
] as const

export type OnboardingFormData = {
  role: string
  career_goal: string
  skill_domains: string[]
  skillLevel: string
  coding_experience: boolean | null
  weekly_hours: string
  target_timeline: string
}

export type OnboardingDraft = {
  step: number
  data: OnboardingFormData
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
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

export function createEmptyOnboardingForm(): OnboardingFormData {
  return {
    role: "",
    career_goal: "",
    skill_domains: [],
    skillLevel: "",
    coding_experience: null,
    weekly_hours: "",
    target_timeline: "",
  }
}

export function buildOnboardingFormFromProfile(profile: UserProfileData): OnboardingFormData {
  const normalizedProfile = normalizeUserProfile(profile)

  return {
    role: normalizedProfile.role,
    career_goal: normalizedProfile.career_goal,
    skill_domains: normalizedProfile.skill_domains,
    skillLevel: normalizedProfile.skillLevel,
    coding_experience: normalizedProfile.coding_experience,
    weekly_hours: normalizedProfile.weekly_hours,
    target_timeline: normalizedProfile.target_timeline,
  }
}

export function mergeOnboardingState(
  profile: UserProfileData,
  draft: OnboardingDraft | null,
): OnboardingDraft {
  const baseData = buildOnboardingFormFromProfile(profile)

  if (!draft) {
    return {
      step: getFirstIncompleteOnboardingStep(baseData),
      data: baseData,
    }
  }

  return {
    step: Math.max(0, Math.min(draft.step, 6)),
    data: {
      role: draft.data.role || baseData.role,
      career_goal: draft.data.career_goal || baseData.career_goal,
      skill_domains:
        draft.data.skill_domains.length > 0 ? draft.data.skill_domains : baseData.skill_domains,
      skillLevel: draft.data.skillLevel || baseData.skillLevel,
      coding_experience: draft.data.coding_experience ?? baseData.coding_experience,
      weekly_hours: draft.data.weekly_hours || baseData.weekly_hours,
      target_timeline: draft.data.target_timeline || baseData.target_timeline,
    },
  }
}

function normalizeDraft(input: unknown): OnboardingDraft | null {
  if (!input || typeof input !== "object") {
    return null
  }

  const rawDraft = input as {
    step?: unknown
    data?: Partial<OnboardingFormData>
  }

  const rawData = rawDraft.data
  const data: OnboardingFormData = {
    role: normalizeString(rawData?.role),
    career_goal: normalizeString(rawData?.career_goal),
    skill_domains: normalizeStringArray(rawData?.skill_domains),
    skillLevel: normalizeString(rawData?.skillLevel),
    coding_experience:
      typeof rawData?.coding_experience === "boolean" ? rawData.coding_experience : null,
    weekly_hours: normalizeString(rawData?.weekly_hours),
    target_timeline: normalizeString(rawData?.target_timeline),
  }

  return {
    step:
      typeof rawDraft.step === "number" && Number.isFinite(rawDraft.step)
        ? Math.max(0, Math.min(rawDraft.step, 6))
        : 0,
    data,
  }
}

export function loadOnboardingDraft() {
  const storage = getBrowserStorage()

  if (!storage) {
    return null
  }

  const rawDraft = storage.getItem(ONBOARDING_DRAFT_STORAGE_KEY)
  if (!rawDraft) {
    return null
  }

  try {
    return normalizeDraft(JSON.parse(rawDraft))
  } catch {
    return null
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function clearOnboardingDraft() {
  getBrowserStorage()?.removeItem(ONBOARDING_DRAFT_STORAGE_KEY)
}

export function getOnboardingStepError(step: number, formData: OnboardingFormData) {
  switch (step) {
    case 0:
      return formData.role ? null : "Choose the role that best matches where you are today."
    case 1:
      return formData.career_goal ? null : "Choose the outcome you want this learning journey to support."
    case 2:
      return formData.skill_domains.length > 0
        ? null
        : "Select at least one skill domain so we can personalize your roadmap."
    case 3:
      return formData.skillLevel ? null : "Pick your current skill level before continuing."
    case 4:
      return formData.coding_experience !== null
        ? null
        : "Tell us whether you already have coding experience."
    case 5:
      return formData.weekly_hours ? null : "Choose how many hours you can commit each week."
    case 6:
      return formData.target_timeline ? null : "Choose a target timeline for your learning plan."
    default:
      return null
  }
}

export function getFirstIncompleteOnboardingStep(formData: OnboardingFormData) {
  for (let stepIndex = 0; stepIndex < 7; stepIndex += 1) {
    if (getOnboardingStepError(stepIndex, formData)) {
      return stepIndex
    }
  }

  return 6
}

export function buildOnboardingPayload(formData: OnboardingFormData) {
  return {
    role: formData.role,
    career_goal: formData.career_goal,
    skill_domains: formData.skill_domains,
    skillLevel: formData.skillLevel,
    coding_experience: formData.coding_experience === true,
    weekly_hours: formData.weekly_hours,
    target_timeline: formData.target_timeline,
    onboarding_completed: true,
  }
}
