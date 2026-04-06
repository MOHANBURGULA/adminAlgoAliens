"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, CheckCircle2, GraduationCap, Tag, Users } from "lucide-react"
import CompletionBarChart from "@/components/admin/charts/CompletionBarChart"
import TrendLineChart from "@/components/admin/charts/TrendLineChart"
import CategorySelect from "@/components/admin/ui/CategorySelect"
import StatsCard from "@/components/admin/ui/StatsCard"
import {
  type AdminCourseSummary,
  type AdminEnrollmentRecord,
  type AdminUserSummary,
  buildEnrollmentTrendData,
  calculateCompletionRate,
  groupEnrollmentsByCourse,
} from "@/lib/admin-dashboard"
import type { AdminCategoryAnalytics, AdminCategoryRecord } from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [courses, setCourses] = useState<AdminCourseSummary[]>([])
  const [enrollments, setEnrollments] = useState<AdminEnrollmentRecord[]>([])
  const [categoryAnalytics, setCategoryAnalytics] = useState<AdminCategoryAnalytics[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadAnalytics = async () => {
      try {
        const [usersResponse, coursesResponse, enrollmentsResponse, categoryResponse] =
          await Promise.all([
            apiClient.get("/api/admin/users"),
            apiClient.get("/api/admin/courses"),
            apiClient.get("/api/admin/enrollments"),
            apiClient.get("/api/admin/analytics/by-category"),
          ])

        if (cancelled) {
          return
        }

        setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserSummary[]) : [])
        setCourses(
          Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseSummary[]) : [],
        )
        setEnrollments(
          Array.isArray(enrollmentsResponse.data)
            ? (enrollmentsResponse.data as AdminEnrollmentRecord[])
            : [],
        )
        setCategoryAnalytics(
          Array.isArray(categoryResponse.data)
            ? (categoryResponse.data as AdminCategoryAnalytics[])
            : [],
        )
        setError("")
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError))
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
  const completionRate = useMemo(() => calculateCompletionRate(enrollments), [enrollments])
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
  const trendData = useMemo(() => buildEnrollmentTrendData(enrollments), [enrollments])
  const sortedCategoryAnalytics = useMemo(
    () =>
      [...categoryAnalytics].sort((left, right) =>
        left.categoryName.localeCompare(right.categoryName),
      ),
    [categoryAnalytics],
  )
  const categoryOptions = useMemo<AdminCategoryRecord[]>(
    () =>
      sortedCategoryAnalytics.map((category) => ({
        id: category.categoryId,
        name: category.categoryName,
      })),
    [sortedCategoryAnalytics],
  )
  const visibleCategoryAnalytics = useMemo(() => {
    if (selectedCategoryId === "all") {
      return sortedCategoryAnalytics
    }

    return sortedCategoryAnalytics.filter((category) => category.categoryId === selectedCategoryId)
  }, [selectedCategoryId, sortedCategoryAnalytics])
  const selectedCategorySummary = useMemo(
    () =>
      visibleCategoryAnalytics.reduce(
        (summary, category) => ({
          certificateCount: summary.certificateCount + category.certificateCount,
          courseCount: summary.courseCount + category.courseCount,
          enrollmentCount: summary.enrollmentCount + category.enrollmentCount,
        }),
        { courseCount: 0, enrollmentCount: 0, certificateCount: 0 },
      ),
    [visibleCategoryAnalytics],
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
          Enrollment health across the platform, now with a visible category-level analytics filter so you can inspect courses category by category.
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
            <h2 className="text-xl font-semibold text-white">Analytics by Category</h2>
            <p className="mt-2 text-sm text-gray-400">
              Pick a category to inspect, or keep the full platform-wide category view.
            </p>
          </div>
          <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-gray-300">
            {categoryAnalytics.length} categories
          </span>
        </div>

        {categoryAnalytics.length === 0 ? (
          <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-400">
            No categories found. Create categories and assign courses to see category analytics.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-5">
                <CategorySelect
                  categories={categoryOptions}
                  label="Category analytics view"
                  value={selectedCategoryId}
                  onChange={setSelectedCategoryId}
                />
                <p className="mt-3 text-xs leading-6 text-gray-400">
                  This filter changes the summary cards and the table below, so you can inspect one category or compare the whole platform.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatsCard
                  label="Courses in View"
                  value={selectedCategorySummary.courseCount}
                  hint={
                    selectedCategoryId === "all"
                      ? "Across all categories"
                      : "Within the selected category"
                  }
                  icon={BookOpen}
                  accentClassName="text-indigo-200"
                />
                <StatsCard
                  label="Enrollments in View"
                  value={selectedCategorySummary.enrollmentCount}
                  hint={
                    selectedCategoryId === "all"
                      ? "All category enrollments"
                      : "Enrollments in the selected category"
                  }
                  icon={GraduationCap}
                  accentClassName="text-violet-200"
                />
                <StatsCard
                  label="Certificates in View"
                  value={selectedCategorySummary.certificateCount}
                  hint={
                    selectedCategoryId === "all"
                      ? "All category certificates"
                      : "Certificates in the selected category"
                  }
                  icon={Tag}
                  accentClassName="text-emerald-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-purple-900/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-900/30 bg-[#0B0518]">
                    <th className="px-6 py-4 text-left font-medium text-slate-300">Category</th>
                    <th className="px-6 py-4 text-right font-medium text-slate-300">Courses</th>
                    <th className="px-6 py-4 text-right font-medium text-slate-300">Enrollments</th>
                    <th className="px-6 py-4 text-right font-medium text-slate-300">Certificates</th>
                    <th className="px-6 py-4 text-right font-medium text-slate-300">Cert Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 bg-[#0B0518]">
                  {visibleCategoryAnalytics.map((category) => {
                    const certRate =
                      category.enrollmentCount > 0
                        ? Math.round((category.certificateCount / category.enrollmentCount) * 100)
                        : 0

                    return (
                      <tr key={category.categoryId} className="transition-colors hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tag size={14} className="shrink-0 text-indigo-400" />
                            <span className="font-medium text-white">{category.categoryName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">{category.courseCount}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{category.enrollmentCount}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{category.certificateCount}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              certRate >= 70
                                ? "bg-green-500/10 text-green-300"
                                : certRate >= 40
                                  ? "bg-yellow-500/10 text-yellow-300"
                                  : "bg-red-500/10 text-red-300"
                            }`}
                          >
                            {certRate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <CompletionBarChart data={completionChartData} />
      <TrendLineChart data={trendData} />
    </div>
  )
}
