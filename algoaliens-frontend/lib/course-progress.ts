export type CourseProgressStatus = "completed" | "in-progress" | "not-started"

export function clampProgress(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

export function getCourseProgressStatus(progress?: number | null): CourseProgressStatus {
  const normalized = clampProgress(progress)

  if (normalized >= 100) {
    return "completed"
  }

  if (normalized > 0) {
    return "in-progress"
  }

  return "not-started"
}

export function getCourseProgressLabel(status: CourseProgressStatus) {
  if (status === "completed") {
    return "Completed"
  }

  if (status === "in-progress") {
    return "In Progress"
  }

  return "Not Started"
}

export function getCourseProgressVariant(status: CourseProgressStatus) {
  if (status === "completed") {
    return "success" as const
  }

  if (status === "in-progress") {
    return "warning" as const
  }

  return "neutral" as const
}

export function getAverageProgress(values: Array<number | null | undefined>) {
  if (values.length === 0) {
    return 0
  }

  const total = values.reduce<number>((sum, current) => sum + clampProgress(current), 0)
  return Math.round(total / values.length)
}
