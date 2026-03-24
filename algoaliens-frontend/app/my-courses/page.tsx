"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BarChart3, BookOpen, PieChart as PieChartIcon } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartCard } from "@/components/learner/ChartCard"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/axios"
import { getAverageProgress, getCourseProgressStatus } from "@/lib/course-progress"

type Enrollment = {
  id: number
  courseId: number
  progress: number
  createdAt: string
}

type Course = {
  id: number
  title: string
  difficulty: string
}

type EnrolledCourse = Enrollment & {
  course: Course | null
}

const statusColors = ["#7c3aed", "#a855f7", "#d946ef"] as const
const progressColors = ["#7c3aed", "#8b5cf6", "#a855f7", "#c084fc", "#d946ef"] as const

function formatDifficulty(value?: string) {
  if (!value) {
    return "Unknown"
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

function shortenLabel(value: string) {
  return value.length > 16 ? `${value.slice(0, 16)}...` : value
}

function getPortfolioCardTheme(progress: number) {
  const status = getCourseProgressStatus(progress)

  if (status === "completed") {
    return {
      accentGlow: "bg-fuchsia-500/16",
      accentLine: "from-transparent via-fuchsia-300/80 to-transparent",
      meta: "border-fuchsia-400/15 bg-fuchsia-500/[0.05]",
      progress: "from-fuchsia-500 via-violet-500 to-purple-700",
      status: "bg-fuchsia-500/12 text-fuchsia-100",
    }
  }

  if (status === "in-progress") {
    return {
      accentGlow: "bg-violet-500/16",
      accentLine: "from-transparent via-violet-300/80 to-transparent",
      meta: "border-violet-400/15 bg-violet-500/[0.05]",
      progress: "from-indigo-400 via-violet-500 to-fuchsia-500",
      status: "bg-violet-500/12 text-violet-100",
    }
  }

  return {
    accentGlow: "bg-indigo-500/16",
    accentLine: "from-transparent via-indigo-300/80 to-transparent",
    meta: "border-indigo-400/15 bg-indigo-500/[0.05]",
    progress: "from-indigo-400 via-slate-400 to-violet-400",
    status: "bg-indigo-500/12 text-indigo-100",
  }
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadEnrollments = async () => {
      try {
        setLoading(true)
        setError("")

        const enrollmentsRes = await apiClient.get("/api/enroll")
        const enrollments = enrollmentsRes.data as Enrollment[]

        const courseResults = await Promise.allSettled(
          enrollments.map((enrollment) => apiClient.get(`/api/courses/${enrollment.courseId}`)),
        )

        const combined = enrollments
          .map((enrollment, index) => ({
            ...enrollment,
            course:
              courseResults[index]?.status === "fulfilled"
                ? (courseResults[index].value.data as Course)
                : null,
          }))
          .sort((left, right) => right.progress - left.progress)

        if (!cancelled) {
          setCourses(combined)
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          const responseStatus =
            typeof loadError === "object" && loadError !== null && "response" in loadError
              ? (loadError as { response?: { status?: number; data?: { message?: string } } }).response
              : undefined

          if (responseStatus?.status === 404) {
            setCourses([])
            return
          }

          setError(responseStatus?.data?.message || "Unable to load your courses.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadEnrollments()

    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    const completed = courses.filter((course) => getCourseProgressStatus(course.progress) === "completed").length
    const inProgress = courses.filter((course) => getCourseProgressStatus(course.progress) === "in-progress").length
    const notStarted = courses.length - completed - inProgress

    return {
      averageProgress: getAverageProgress(courses.map((course) => course.progress)),
      completed,
      inProgress,
      notStarted,
      total: courses.length,
    }
  }, [courses])

  const statusChartData = useMemo(
    () => [
      { name: "Completed", value: summary.completed },
      { name: "In Progress", value: summary.inProgress },
      { name: "Not Started", value: summary.notStarted },
    ],
    [summary.completed, summary.inProgress, summary.notStarted],
  )

  const progressChartData = useMemo(
    () =>
      courses.map((course) => ({
        courseId: course.courseId,
        name: shortenLabel(course.course?.title || `Course ${course.courseId}`),
        progress: course.progress,
      })),
    [courses],
  )

  if (loading) {
    return (
      <div className="card-ui flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading your courses...
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

  if (courses.length === 0) {
    return (
      <div className="card-ui space-y-4 text-center text-gray-400">
        <h1 className="text-2xl font-semibold text-white">No courses enrolled yet</h1>
        <p>Enroll in a course to start tracking your progress here.</p>
        <div>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-fuchsia-950/20 transition-all duration-300 hover:scale-[1.02]"
          >
            Explore Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <BookOpen className="text-purple-300" size={24} />
          My Courses
        </h1>
        <p className="mt-2 text-sm text-gray-400">Track progress across your live enrollments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-ui !p-5">
          <p className="text-sm text-gray-400">Total courses</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.total}</p>
        </div>
        <div className="card-ui !p-5">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.completed}</p>
        </div>
        <div className="card-ui !p-5">
          <p className="text-sm text-gray-400">Average progress</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.averageProgress}%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ChartCard
          title="Completion Status"
          description="See how many of your courses are completed, active, or not started."
          action={
            <Badge variant="secondary" className="gap-2">
              <PieChartIcon size={12} />
              Live status
            </Badge>
          }
          contentClassName="h-[320px] p-6"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={108}
                paddingAngle={4}
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(18, 9, 42, 0.96)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  borderRadius: "16px",
                  color: "#f5f3ff",
                }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Course Progress"
          description="Compare the completion percentage for each enrolled course."
          action={
            <Badge variant="secondary" className="gap-2">
              <BarChart3 size={12} />
              Progress view
            </Badge>
          }
          contentClassName="h-[320px] p-6"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressChartData} barCategoryGap={18}>
              <CartesianGrid stroke="#31204d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#c4b5fd" />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} stroke="#c4b5fd" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(18, 9, 42, 0.96)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  borderRadius: "16px",
                  color: "#f5f3ff",
                }}
              />
              <Bar dataKey="progress" radius={[12, 12, 0, 0]}>
                {progressChartData.map((entry, index) => (
                  <Cell key={entry.courseId} fill={progressColors[index % progressColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5">
        {courses.map((course) => {
          const theme = getPortfolioCardTheme(course.progress)

          return (
          <div
            key={course.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,16,24,0.98),rgba(26,15,46,0.92))] p-6 shadow-[0_18px_45px_rgba(8,6,22,0.34)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_26px_56px_rgba(18,12,38,0.44)]"
          >
            <div
              className={`absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-90 ${theme.accentGlow}`}
            />
            <div className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r ${theme.accentLine}`} />

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {course.course?.title || `Course #${course.courseId}`}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${theme.status}`}>
                    {getCourseProgressStatus(course.progress).replace("-", " ")}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    {formatDifficulty(course.course?.difficulty)}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-400">
                  <p>Enrolled on {formatDate(course.createdAt)}</p>
                </div>
              </div>

              <Link
                href={`/courses/${course.courseId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-3 text-sm font-medium text-white shadow-md shadow-fuchsia-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_20px_40px_rgba(217,70,239,0.24)]"
              >
                Continue
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className={`relative z-10 mt-5 rounded-2xl border p-4 ${theme.meta}`}>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>

              <div className="mt-3 h-3 rounded-full bg-[rgba(9,12,20,0.8)]">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r transition-all duration-300 ${theme.progress}`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}
