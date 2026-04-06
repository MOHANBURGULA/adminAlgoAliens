"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Award, BookOpen, CheckCircle2, Target, User2 } from "lucide-react"
import { ProgressBar } from "@/components/learner/ProgressBar"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage, isAxiosStatus } from "@/lib/http"
import { normalizeUserProfile } from "@/lib/profile"

type DashboardEnrollment = {
  id: number
  courseId: number
  progress: number
  createdAt: string
}

type DashboardResponse = {
  enrolledCourses: number
  enrollments: DashboardEnrollment[]
  completedModulesCount: number
  certificatesEarned: number
  evaluationSummary: {
    total: number
    pending: number
    passed: number
    failed: number
  }
}

type User = {
  id: number
  name: string
  email: string
}

type Profile = {
  skillLevel: string
  interests: string[]
  goal?: string
}

type Course = {
  id: number
  title: string
  difficulty: string
}

type DashboardState = {
  dashboard: DashboardResponse
  user: User
  profile: Profile
  recentCourses: Array<DashboardEnrollment & { title: string; difficulty: string }>
}

function normalizeDashboard(
  payload: Partial<DashboardResponse> | null | undefined,
): DashboardResponse {
  return {
    enrolledCourses: payload?.enrolledCourses ?? 0,
    enrollments: Array.isArray(payload?.enrollments) ? payload.enrollments : [],
    completedModulesCount: payload?.completedModulesCount ?? 0,
    certificatesEarned: payload?.certificatesEarned ?? 0,
    evaluationSummary: {
      total: payload?.evaluationSummary?.total ?? 0,
      pending: payload?.evaluationSummary?.pending ?? 0,
      passed: payload?.evaluationSummary?.passed ?? 0,
      failed: payload?.evaluationSummary?.failed ?? 0,
    },
  }
}

function formatLabel(value?: string) {
  if (!value) {
    return "Not set"
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError("")

        const [dashboardRes, userRes, profileRes] = await Promise.all([
          apiClient.get("/api/dashboard"),
          apiClient.get("/api/users/me"),
          apiClient.get("/api/profile"),
        ])

        const dashboard = normalizeDashboard(dashboardRes.data as Partial<DashboardResponse>)
        const user = userRes.data as User
        const profile = normalizeUserProfile(profileRes.data as Partial<Profile>)

        const recentEnrollments = [...dashboard.enrollments]
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          )
          .slice(0, 3)

        const courseResults = await Promise.allSettled(
          recentEnrollments.map((enrollment) => apiClient.get(`/api/courses/${enrollment.courseId}`)),
        )

        const recentCourses = recentEnrollments.map((enrollment, index) => {
          const result = courseResults[index]
          const course = result.status === "fulfilled" ? (result.value.data as Course) : null

          return {
            ...enrollment,
            title: course?.title || `Course #${enrollment.courseId}`,
            difficulty: course?.difficulty || "unknown",
          }
        })

        if (!cancelled) {
          setData({
            dashboard,
            user,
            profile,
            recentCourses,
          })
        }
      } catch (loadError: unknown) {
        if (cancelled) {
          return
        }

        if (isAxiosStatus(loadError, 404)) {
          router.replace("/onboarding")
          return
        }

        setError(getApiErrorMessage(loadError, "Unable to load dashboard data."))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [router])

  const completionRate = useMemo(() => {
    if (!data || data.dashboard.enrolledCourses === 0) {
      return 0
    }

    const estimatedTotalModules = data.dashboard.enrolledCourses * 5
    return Math.min(
      100,
      Math.round((data.dashboard.completedModulesCount / estimatedTotalModules) * 100),
    )
  }, [data])

  if (loading) {
    return (
      <div className="card-ui flex min-h-[50vh] items-center justify-center p-6 text-theme-muted">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  if (!data) {
    return <div className="card-ui p-6 text-theme-muted">No dashboard data available yet.</div>
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="app-panel p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-theme-muted">Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-theme-main">
            Welcome back, {data.user.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-theme-muted">
            Your live learning snapshot includes enrollments, module completion, certificates, and
            profile details from the backend.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="theme-chip px-4 py-2 text-sm">
              Skill level: {formatLabel(data.profile.skillLevel)}
            </span>
            {data.profile.interests.map((interest) => (
              <span key={interest} className="theme-chip theme-chip-secondary px-4 py-2 text-sm">
                {interest}
              </span>
            ))}
          </div>

          <div className="mt-6 app-subcard p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-theme-muted">Current goal</p>
                <p className="mt-2 text-lg font-medium text-theme-main">
                  {data.profile.goal || "No goal set yet"}
                </p>
              </div>

              <Button asChild>
                <Link href="/profile">View profile</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="app-card p-8">
          <div className="flex items-center gap-3 text-theme-main">
            <Target className="text-[var(--accent-magenta)]" size={20} />
            <h2 className="text-2xl font-semibold">Learning progress</h2>
          </div>

          <div className="mt-6">
            <ProgressBar value={completionRate} label="Estimated completion" />
          </div>

          <div className="mt-6 space-y-4 text-sm text-theme-muted">
            <div className="app-subcard !px-4 !py-3 flex items-center justify-between">
              <span>Completed modules</span>
              <span>{data.dashboard.completedModulesCount}</span>
            </div>
            <div className="app-subcard !px-4 !py-3 flex items-center justify-between">
              <span>Passed evaluations</span>
              <span>{data.dashboard.evaluationSummary.passed}</span>
            </div>
            <div className="app-subcard !px-4 !py-3 flex items-center justify-between">
              <span>Pending evaluations</span>
              <span>{data.dashboard.evaluationSummary.pending}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-stat p-6 md:p-7">
          <BookOpen className="text-[var(--accent-magenta)]" size={22} />
          <p className="mt-4 text-3xl font-semibold text-theme-main">
            {data.dashboard.enrolledCourses}
          </p>
          <p className="mt-1 text-sm text-theme-muted">Enrolled courses</p>
        </div>

        <div className="app-stat p-6 md:p-7">
          <CheckCircle2 className="text-[var(--accent-cyan)]" size={22} />
          <p className="mt-4 text-3xl font-semibold text-theme-main">
            {data.dashboard.completedModulesCount}
          </p>
          <p className="mt-1 text-sm text-theme-muted">Completed modules</p>
        </div>

        <div className="app-stat p-6 md:p-7">
          <Award className="text-[var(--accent-magenta)]" size={22} />
          <p className="mt-4 text-3xl font-semibold text-theme-main">
            {data.dashboard.certificatesEarned}
          </p>
          <p className="mt-1 text-sm text-theme-muted">Certificates earned</p>
        </div>

        <div className="app-stat p-6 md:p-7">
          <User2 className="text-[var(--accent-cyan)]" size={22} />
          <p className="mt-4 text-3xl font-semibold text-theme-main">
            {data.dashboard.evaluationSummary.total}
          </p>
          <p className="mt-1 text-sm text-theme-muted">Evaluations submitted</p>
        </div>
      </section>

      <section className="app-card p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-theme-main">Recent courses</h2>
            <p className="mt-2 text-sm leading-7 text-theme-muted">
              Resume your latest enrolled courses.
            </p>
          </div>

          <Button asChild variant="secondary">
            <Link href="/my-courses">View all</Link>
          </Button>
        </div>

        {data.recentCourses.length === 0 ? (
          <div className="theme-empty-state mt-6 border-dashed p-6 text-sm">
            You have not enrolled in any courses yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {data.recentCourses.map((course) => (
              <div
                key={course.id}
                className="theme-card theme-card-interactive p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-theme-main">{course.title}</h3>
                    <p className="mt-1 text-sm text-theme-muted">
                      Difficulty: {formatLabel(course.difficulty)}
                    </p>
                    <p className="mt-1 text-sm text-theme-muted">
                      Updated {formatDate(course.createdAt)}
                    </p>
                  </div>
                  <span className="theme-chip px-3 py-1 text-xs">
                    {course.progress}%
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar value={course.progress} label="Progress" />
                </div>

                <Link
                  href={`/courses/${course.courseId}/learn`}
                  className="theme-outline-link mt-5 px-4 py-2 text-sm"
                >
                  Continue course
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
