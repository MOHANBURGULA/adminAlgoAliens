import { normalizeDifficulty } from "@/lib/learning"

export type CourseStatus = "Completed" | "In Progress" | "Not Started"

export function clampProgress(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(value)))
}

export function getCourseStatus(progress?: number): CourseStatus {
  const safeProgress = clampProgress(progress)

  if (safeProgress >= 100) {
    return "Completed"
  }

  if (safeProgress > 0) {
    return "In Progress"
  }

  return "Not Started"
}

export function getCourseStatusVariant(status: CourseStatus) {
  if (status === "Completed") {
    return "success" as const
  }

  if (status === "In Progress") {
    return "warning" as const
  }

  return "neutral" as const
}

export function getDifficultyVariant(difficulty: string) {
  const normalized = normalizeDifficulty(difficulty)

  if (normalized === "advanced") {
    return "advanced" as const
  }

  if (normalized === "intermediate") {
    return "intermediate" as const
  }

  return "beginner" as const
}
