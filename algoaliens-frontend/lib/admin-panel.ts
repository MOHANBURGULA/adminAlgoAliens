export type AdminDashboardData = {
  totalStudents: number
  totalEnrollments: number
  totalCertificates: number
  pendingEvaluations: number
  pendingProjects: number
  pendingVideos: number
  totalCourses: number
}

export type AdminUserRecord = {
  id: number
  name: string
  email: string
  role: string
  createdAt?: string
}

export type AdminEnrollmentSummary = {
  id: number
  courseId: number
  progress: number
  createdAt?: string
}

export type AdminEvaluationSummary = {
  id: number
  courseId: number
  status: string
  finalScore?: number
  aiDetectionScore?: number
  createdAt?: string
}

export type AdminCertificateSummary = {
  id: number
  userId: number
  courseId: number
  score: number
  issuedAt?: string
}

export type AdminUserDetails = AdminUserRecord & {
  enrollments: AdminEnrollmentSummary[]
  evaluations: AdminEvaluationSummary[]
  certificates: AdminCertificateSummary[]
}

export type AdminProjectRecord = {
  id: number
  userId: number
  courseId: number
  githubLink: string
  description: string
  status: string
  feedback?: string
  createdAt?: string
}

export type AdminVideoRecord = {
  id: number
  userId: number
  title: string
  description: string
  videoUrl: string
  status: string
  createdAt?: string
}

export type AdminCourseRecord = {
  id: number
  title: string
  difficulty: string
  moduleCount?: number
  enrollmentCount?: number
  certificateCount?: number
  createdAt?: string
}

export type AdminChartDatum = {
  name: string
  value: number
  color: string
}

export type BadgeTone =
  | "indigo"
  | "purple"
  | "green"
  | "red"
  | "yellow"
  | "slate"

export type StatusMeta = {
  label: string
  tone: BadgeTone
}

export type RecentActivityItem = {
  id: string
  title: string
  subtitle: string
  dateLabel: string
  typeLabel: string
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

export function compareByCreatedAtDesc(left?: string, right?: string) {
  const leftTime = left ? new Date(left).getTime() : 0
  const rightTime = right ? new Date(right).getTime() : 0

  return rightTime - leftTime
}

export function getRoleMeta(role: string): StatusMeta {
  if (role === "admin") {
    return {
      label: "Admin",
      tone: "purple",
    }
  }

  return {
    label: "Student",
    tone: "indigo",
  }
}

export function getProjectStatusMeta(status: string): StatusMeta {
  const normalized = status.trim().toLowerCase()

  if (normalized === "approved") {
    return { label: "Approved", tone: "green" }
  }

  if (normalized === "rejected") {
    return { label: "Rejected", tone: "red" }
  }

  return { label: "Pending", tone: "yellow" }
}

export function getVideoStatusMeta(status: string): StatusMeta {
  const normalized = status.trim().toLowerCase()

  if (normalized === "approved") {
    return { label: "Approved", tone: "green" }
  }

  if (normalized === "rejected") {
    return { label: "Rejected", tone: "red" }
  }

  return { label: "Pending Review", tone: "yellow" }
}

export function getDifficultyMeta(difficulty: string): StatusMeta {
  const normalized = difficulty.trim().toLowerCase()

  if (normalized === "beginner") {
    return { label: "Beginner", tone: "indigo" }
  }

  if (normalized === "advanced") {
    return { label: "Advanced", tone: "red" }
  }

  return { label: difficulty || "Intermediate", tone: "yellow" }
}

export function buildCourseEnrollmentChartData(courses: AdminCourseRecord[]) {
  return [...courses]
    .sort((left, right) => (right.enrollmentCount ?? 0) - (left.enrollmentCount ?? 0))
    .map((course) => ({
      name: course.title,
      value: course.enrollmentCount ?? 0,
    }))
}

export function buildProjectStatusChartData(projects: AdminProjectRecord[]) {
  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
  }

  for (const project of projects) {
    const normalized = project.status.trim().toLowerCase()

    if (normalized === "approved") {
      counts.approved += 1
    } else if (normalized === "rejected") {
      counts.rejected += 1
    } else {
      counts.pending += 1
    }
  }

  return [
    { name: "Pending", value: counts.pending, color: "#FBBF24" },
    { name: "Approved", value: counts.approved, color: "#34D399" },
    { name: "Rejected", value: counts.rejected, color: "#F87171" },
  ] satisfies AdminChartDatum[]
}

export function buildRecentUsers(users: AdminUserRecord[]) {
  return [...users]
    .sort((left, right) => compareByCreatedAtDesc(left.createdAt, right.createdAt))
    .slice(0, 5)
    .map((user) => ({
      id: `user-${user.id}`,
      title: user.name,
      subtitle: user.email,
      dateLabel: formatAdminDate(user.createdAt),
      typeLabel: getRoleMeta(user.role).label,
    })) satisfies RecentActivityItem[]
}

export function buildRecentApprovals(
  projects: AdminProjectRecord[],
  videos: AdminVideoRecord[],
) {
  const approvedProjects = projects
    .filter((project) => project.status.trim().toLowerCase() === "approved")
    .map((project) => ({
      id: `project-${project.id}`,
      title: `Project #${project.id}`,
      subtitle: `User ${project.userId} · Course ${project.courseId}`,
      dateLabel: formatAdminDate(project.createdAt),
      typeLabel: "Project",
      createdAt: project.createdAt,
    }))

  const approvedVideos = videos
    .filter((video) => video.status.trim().toLowerCase() === "approved")
    .map((video) => ({
      id: `video-${video.id}`,
      title: video.title,
      subtitle: `User ${video.userId}`,
      dateLabel: formatAdminDate(video.createdAt),
      typeLabel: "Video",
      createdAt: video.createdAt,
    }))

  return [...approvedProjects, ...approvedVideos]
    .sort((left, right) => compareByCreatedAtDesc(left.createdAt, right.createdAt))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      dateLabel: item.dateLabel,
      typeLabel: item.typeLabel,
    })) satisfies RecentActivityItem[]
}

export function buildCourseMap(courses: AdminCourseRecord[]) {
  return Object.fromEntries(courses.map((course) => [course.id, course.title])) as Record<number, string>
}

export function getCourseLabel(courseId: number, courseMap: Record<number, string>) {
  return courseMap[courseId] ?? `Course #${courseId}`
}
