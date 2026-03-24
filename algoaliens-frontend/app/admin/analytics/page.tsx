"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, CheckCircle2, GraduationCap, Users } from "lucide-react"
import CompletionBarChart from "@/components/admin/charts/CompletionBarChart"
import EnrollmentPieChart from "@/components/admin/charts/EnrollmentPieChart"
import TrendLineChart from "@/components/admin/charts/TrendLineChart"
import StatsCard from "@/components/admin/ui/StatsCard"
import {
  type AdminCourseSummary,
  type AdminEnrollmentRecord,
  type AdminUserSummary,
  buildEnrollmentTrendData,
  calculateCompletionRate,
  groupEnrollmentsByCourse,
} from "@/lib/admin-dashboard"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [courses, setCourses] = useState<AdminCourseSummary[]>([])
  const [enrollments, setEnrollments] = useState<AdminEnrollmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadAnalytics = async () => {
      try {
        const [usersResponse, coursesResponse, enrollmentsResponse] = await Promise.all([
          apiClient.get("/api/admin/users"),
          apiClient.get("/api/admin/courses"),
          apiClient.get("/api/admin/enrollments"),
        ])

        if (cancelled) {
          return
        }

        setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserSummary[]) : [])
        setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseSummary[]) : [])
        setEnrollments(
          Array.isArray(enrollmentsResponse.data)
            ? (enrollmentsResponse.data as AdminEnrollmentRecord[])
            : [],
        )
        setError("")
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Unable to load analytics."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [])

  const courseAnalytics = useMemo(
    () => groupEnrollmentsByCourse(enrollments, courses),
    [courses, enrollments],
  )
  const completionRate = useMemo(
    () => calculateCompletionRate(enrollments),
    [enrollments],
  )
  const activeCourses = useMemo(
    () => courseAnalytics.filter((course) => course.totalEnrollments > 0).length,
    [courseAnalytics],
  )
  const completionChartData = useMemo(
    () =>
      courseAnalytics.map((course) => ({
        courseName: course.courseName,
        completionRate: course.completionRate,
        totalEnrollments: course.totalEnrollments,
      })),
    [courseAnalytics],
  )
  const trendData = useMemo(
    () => buildEnrollmentTrendData(enrollments),
    [enrollments],
  )

  if (loading) {
    return <div className="text-gray-300">Loading analytics...</div>
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Analytics</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Enrollment health across the admin panel, with course-level completion visibility and
          responsive charts powered by live platform data.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Users"
          value={users.length}
          hint="All student and admin accounts"
          icon={Users}
          accentClassName="text-indigo-200"
        />
        <StatsCard
          label="Total Enrollments"
          value={enrollments.length}
          hint="Across every published course"
          icon={GraduationCap}
          accentClassName="text-violet-200"
        />
        <StatsCard
          label="Active Courses"
          value={activeCourses}
          hint="Courses with at least one enrollment"
          icon={BookOpen}
          accentClassName="text-amber-200"
        />
        <StatsCard
          label="Completion Rate"
          value={`${completionRate}%`}
          hint="Enrollments at 100% progress"
          icon={CheckCircle2}
          accentClassName="text-emerald-200"
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Course-wise Enrollment Breakdown</h2>
            <p className="mt-2 text-sm text-gray-400">
              One pie chart per course, split into completed, in progress, and not started learners.
            </p>
          </div>
          <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-gray-300">
            {courseAnalytics.length} courses tracked
          </span>
        </div>

        {courseAnalytics.length ? (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {courseAnalytics.map((course) => (
              <EnrollmentPieChart
                key={course.courseId}
                title={course.courseName}
                description={
                  course.totalEnrollments
                    ? `${course.completed} completed, ${course.inProgress} in progress, ${course.notStarted} not started.`
                    : "Waiting for the first enrollment in this course."
                }
                data={course.chartData}
                total={course.totalEnrollments}
                completionRate={course.completionRate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300 shadow-lg shadow-black/20">
            No courses found. Add courses to unlock course-wise analytics.
          </div>
        )}
      </section>

      <CompletionBarChart data={completionChartData} />
      <TrendLineChart data={trendData} />
    </div>
  )
}
