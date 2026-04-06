export type AdminUserSummary = {
  id: number
  name: string
  email: string
  role: string
  createdAt?: string
}

export type AdminCourseSummary = {
  id: number
  title: string
  difficulty: string
  moduleCount?: number
  enrollmentCount?: number
  certificateCount?: number
  createdAt?: string
}

export type AdminEnrollmentRecord = {
  id: number
  userId: number
  courseId: number
  progress: number
  createdAt?: string
}

export type EnrollmentProgressStatus = "completed" | "in_progress" | "not_started"

export type ChartDatum = {
  name: string
  value: number
  color: string
}

export type CourseEnrollmentAnalytics = {
  courseId: number
  courseName: string
  totalEnrollments: number
  completed: number
  inProgress: number
  notStarted: number
  completionRate: number
  chartData: ChartDatum[]
}

export type EnrollmentTrendPoint = {
  dateKey: string
  label: string
  enrollments: number
}

export type EnrollmentTableRow = {
  id: number
  userId: number
  courseId: number
  userName: string
  courseName: string
  enrollmentDate: string
  progress: number
  status: EnrollmentProgressStatus
}

type StatusMeta = {
  label: string
  color: string
  badgeClassName: string
}

const ENROLLMENT_STATUS_META: Record<EnrollmentProgressStatus, StatusMeta> = {
  completed: {
    label: "Completed",
    color: "#34d399",
    badgeClassName: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20",
  },
  in_progress: {
    label: "In Progress",
    color: "#f59e0b",
    badgeClassName: "bg-amber-500/15 text-amber-200 border border-amber-500/20",
  },
  not_started: {
    label: "Not Started",
    color: "#a78bfa",
    badgeClassName: "bg-violet-500/15 text-violet-200 border border-violet-500/20",
  },
}

export function clampPercentage(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value ?? 0)))
}

export function formatPercent(value: number | null | undefined) {
  return `${clampPercentage(value)}%`
}

export function getEnrollmentProgressStatus(progress: number) {
  const clamped = clampPercentage(progress)

  if (clamped >= 100) {
    return "completed" as const
  }

  if (clamped > 0) {
    return "in_progress" as const
  }

  return "not_started" as const
}

export function getEnrollmentStatusMeta(status: EnrollmentProgressStatus) {
  return ENROLLMENT_STATUS_META[status]
}

export function formatAdminDate(value?: string) {
  if (!value) {
    return "Unknown"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatTrendLabel(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function compareDatesDesc(left?: string, right?: string) {
  const leftValue = left ? new Date(left).getTime() : 0
  const rightValue = right ? new Date(right).getTime() : 0

  return rightValue - leftValue
}

export function calculateCompletionRate(enrollments: AdminEnrollmentRecord[]) {
  if (!enrollments.length) {
    return 0
  }

  const completedCount = enrollments.filter(
    (entry) => getEnrollmentProgressStatus(entry.progress) === "completed",
  ).length

  return Math.round((completedCount / enrollments.length) * 100)
}

export function groupEnrollmentsByCourse(
  enrollments: AdminEnrollmentRecord[],
  courses: AdminCourseSummary[],
) {
  const grouped = new Map<number, AdminEnrollmentRecord[]>()

  for (const enrollment of enrollments) {
    const courseRows = grouped.get(enrollment.courseId) ?? []
    courseRows.push(enrollment)
    grouped.set(enrollment.courseId, courseRows)
  }

  return courses
    .map((course) => {
      const courseEnrollments = grouped.get(course.id) ?? []
      const counts = {
        completed: 0,
        in_progress: 0,
        not_started: 0,
      }

      for (const enrollment of courseEnrollments) {
        counts[getEnrollmentProgressStatus(enrollment.progress)] += 1
      }

      return {
        courseId: course.id,
        courseName: course.title,
        totalEnrollments: courseEnrollments.length,
        completed: counts.completed,
        inProgress: counts.in_progress,
        notStarted: counts.not_started,
        completionRate: calculateCompletionRate(courseEnrollments),
        chartData: [
          {
            name: ENROLLMENT_STATUS_META.completed.label,
            value: counts.completed,
            color: ENROLLMENT_STATUS_META.completed.color,
          },
          {
            name: ENROLLMENT_STATUS_META.in_progress.label,
            value: counts.in_progress,
            color: ENROLLMENT_STATUS_META.in_progress.color,
          },
          {
            name: ENROLLMENT_STATUS_META.not_started.label,
            value: counts.not_started,
            color: ENROLLMENT_STATUS_META.not_started.color,
          },
        ],
      } satisfies CourseEnrollmentAnalytics
    })
    .sort((left, right) => {
      if (right.totalEnrollments !== left.totalEnrollments) {
        return right.totalEnrollments - left.totalEnrollments
      }

      return left.courseName.localeCompare(right.courseName)
    })
}

export function buildEnrollmentTrendData(enrollments: AdminEnrollmentRecord[]) {
  const grouped = new Map<string, number>()

  for (const enrollment of enrollments) {
    const date = enrollment.createdAt ? new Date(enrollment.createdAt) : null

    if (!date || Number.isNaN(date.getTime())) {
      continue
    }

    const key = date.toISOString().slice(0, 10)
    grouped.set(key, (grouped.get(key) ?? 0) + 1)
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, count]) => ({
      dateKey,
      label: formatTrendLabel(dateKey),
      enrollments: count,
    })) satisfies EnrollmentTrendPoint[]
}

export function buildEnrollmentTableRows(
  enrollments: AdminEnrollmentRecord[],
  users: AdminUserSummary[],
  courses: AdminCourseSummary[],
) {
  const userMap = new Map(users.map((user) => [user.id, user.name]))
  const courseMap = new Map(courses.map((course) => [course.id, course.title]))

  return [...enrollments]
    .sort((left, right) => compareDatesDesc(left.createdAt, right.createdAt))
    .map((enrollment) => ({
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      userName: userMap.get(enrollment.userId) ?? `User #${enrollment.userId}`,
      courseName: courseMap.get(enrollment.courseId) ?? `Course #${enrollment.courseId}`,
      enrollmentDate: formatAdminDate(enrollment.createdAt),
      progress: clampPercentage(enrollment.progress),
      status: getEnrollmentProgressStatus(enrollment.progress),
    })) satisfies EnrollmentTableRow[]
}
