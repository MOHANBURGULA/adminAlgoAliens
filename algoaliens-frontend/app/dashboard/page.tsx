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
          apiClient.get("/api/users/profile"),
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
          router.replace("/profile-setup")
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
      <div className="card-ui flex min-h-[50vh] items-center justify-center text-gray-300">
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
    return <div className="card-ui text-gray-300">No dashboard data available yet.</div>
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="app-panel p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-200/70">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back, {data.user.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Your live learning snapshot includes enrollments, module completion, certificates, and
            profile details from the backend.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-purple-500/12 px-4 py-2 text-sm text-purple-100">
              Skill level: {formatLabel(data.profile.skillLevel)}
            </span>
            {data.profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-indigo-500/12 px-4 py-2 text-sm text-indigo-100"
              >
                {interest}
              </span>
            ))}
          </div>

          <div className="mt-6 app-subcard">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">Current goal</p>
                <p className="mt-2 text-lg font-medium text-white">
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
          <div className="flex items-center gap-3 text-white">
            <Target className="text-purple-300" size={20} />
            <h2 className="text-lg font-semibold">Learning progress</h2>
          </div>

          <div className="mt-6">
            <ProgressBar value={completionRate} label="Estimated completion" />
          </div>

          <div className="mt-6 space-y-4 text-sm text-gray-300">
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
        <div className="app-stat">
          <BookOpen className="text-purple-300" size={22} />
          <p className="mt-4 text-3xl font-semibold text-white">{data.dashboard.enrolledCourses}</p>
          <p className="mt-1 text-sm text-gray-400">Enrolled courses</p>
        </div>

        <div className="app-stat">
          <CheckCircle2 className="text-indigo-200" size={22} />
          <p className="mt-4 text-3xl font-semibold text-white">
            {data.dashboard.completedModulesCount}
          </p>
          <p className="mt-1 text-sm text-gray-400">Completed modules</p>
        </div>

        <div className="app-stat">
          <Award className="text-violet-200" size={22} />
          <p className="mt-4 text-3xl font-semibold text-white">
            {data.dashboard.certificatesEarned}
          </p>
          <p className="mt-1 text-sm text-gray-400">Certificates earned</p>
        </div>

        <div className="app-stat">
          <User2 className="text-fuchsia-200" size={22} />
          <p className="mt-4 text-3xl font-semibold text-white">
            {data.dashboard.evaluationSummary.total}
          </p>
          <p className="mt-1 text-sm text-gray-400">Evaluations submitted</p>
        </div>
      </section>

      <section className="app-card p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent courses</h2>
            <p className="mt-1 text-sm text-gray-400">Resume your latest enrolled courses.</p>
          </div>

          <Button asChild variant="secondary">
            <Link href="/my-courses">View all</Link>
          </Button>
        </div>

        {data.recentCourses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(16,20,30,0.96),rgba(23,16,34,0.92))] p-6 text-sm text-gray-400">
            You have not enrolled in any courses yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {data.recentCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,20,30,0.96),rgba(24,16,36,0.94))] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/18"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-white">{course.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Difficulty: {formatLabel(course.difficulty)}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">Updated {formatDate(course.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-purple-500/12 px-3 py-1 text-xs text-purple-100">
                    {course.progress}%
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar value={course.progress} label="Progress" />
                </div>

                <Link
                  href={`/courses/${course.courseId}`}
                  className="mt-5 inline-flex rounded-xl border border-purple-500/25 px-4 py-2 text-sm text-white transition-all duration-300 hover:scale-[1.02] hover:bg-purple-500/10"
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
