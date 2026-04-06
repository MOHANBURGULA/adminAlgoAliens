"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, CheckCircle2, GraduationCap } from "lucide-react"
import EnrollmentPieChart from "@/components/admin/charts/EnrollmentPieChart"
import EnrollmentsTable from "@/components/admin/tables/EnrollmentsTable"
import FilterBar from "@/components/admin/ui/FilterBar"
import StatsCard from "@/components/admin/ui/StatsCard"
import {
  type AdminCourseSummary,
  type AdminEnrollmentRecord,
  type AdminUserSummary,
  buildEnrollmentTableRows,
  type EnrollmentTableRow,
} from "@/lib/admin-dashboard"
import { type AdminCategoryRecord } from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type ProgressFilter =
  | "all"
  | "0-25"
  | "25-50"
  | "50-75"
  | "75-100"
  | "completed"
  | "in_progress"
  | "not_started"

function matchesProgressRange(progress: number, range: ProgressFilter) {
  if (range === "all") return true
  if (range === "completed") return progress >= 100
  if (range === "in_progress") return progress > 0 && progress < 100
  if (range === "not_started") return progress <= 0
  if (range === "0-25") return progress <= 25
  if (range === "25-50") return progress > 25 && progress <= 50
  if (range === "50-75") return progress > 50 && progress <= 75
  return progress > 75
}

function calculateAverageProgress(rows: EnrollmentTableRow[]) {
  if (!rows.length) return 0
  const total = rows.reduce((sum, row) => sum + row.progress, 0)
  return Math.round(total / rows.length)
}

function buildCourseChart(rows: EnrollmentTableRow[]) {
  const grouped = new Map<
    number,
    {
      courseId: number
      courseName: string
      total: number
      completed: number
      inProgress: number
      notStarted: number
    }
  >()

  for (const row of rows) {
    const current = grouped.get(row.courseId) ?? {
      courseId: row.courseId,
      courseName: row.courseName,
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    }
    current.total += 1
    if (row.status === "completed") current.completed += 1
    else if (row.status === "in_progress") current.inProgress += 1
    else current.notStarted += 1
    grouped.set(row.courseId, current)
  }

  return Array.from(grouped.values()).sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total
    return left.courseName.localeCompare(right.courseName)
  })
}

// Extended course summary that carries categoryId (backend already returns it)
type CourseSummaryWithCategory = AdminCourseSummary & { categoryId?: string }

export default function EnrollmentsAdminPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [courses, setCourses] = useState<CourseSummaryWithCategory[]>([])
  const [enrollments, setEnrollments] = useState<AdminEnrollmentRecord[]>([])
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([])
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const debouncedSearch = useDebouncedValue(search, 250)

  useEffect(() => {
    let cancelled = false

    const loadEnrollments = async () => {
      try {
        const [usersResponse, coursesResponse, enrollmentsResponse, categoriesResponse] =
          await Promise.all([
            apiClient.get("/api/admin/users"),
            apiClient.get("/api/admin/courses"),
            apiClient.get("/api/admin/enrollments"),
            apiClient.get("/api/admin/categories").catch(() => ({ data: [] })),
          ])

        if (cancelled) return

        setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserSummary[]) : [])
        setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as CourseSummaryWithCategory[]) : [])
        setEnrollments(
          Array.isArray(enrollmentsResponse.data)
            ? (enrollmentsResponse.data as AdminEnrollmentRecord[])
            : [],
        )
        setCategories(Array.isArray(categoriesResponse.data) ? (categoriesResponse.data as AdminCategoryRecord[]) : [])
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

    void loadEnrollments()
    return () => { cancelled = true }
  }, [])

  // When category changes, reset course filter
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setCourseFilter("all")
  }

  // Courses filtered by selected category
  const coursesInCategory = useMemo(() => {
    const sorted = [...courses].sort((a, b) => a.title.localeCompare(b.title))
    if (categoryFilter === "all") return sorted
    return sorted.filter((c) => c.categoryId === categoryFilter)
  }, [courses, categoryFilter])

  const rows = useMemo(
    () => buildEnrollmentTableRows(enrollments, users, courses),
    [courses, enrollments, users],
  )

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch = !query || row.userName.toLowerCase().includes(query)

      // category filter: find the course's categoryId
      const courseRecord = courses.find((c) => c.id === row.courseId)
      const matchesCategory =
        categoryFilter === "all" || courseRecord?.categoryId === categoryFilter

      const matchesCourse = courseFilter === "all" || String(row.courseId) === courseFilter
      const matchesProgress = matchesProgressRange(row.progress, progressFilter)

      return matchesSearch && matchesCategory && matchesCourse && matchesProgress
    })
  }, [categoryFilter, courseFilter, courses, debouncedSearch, progressFilter, rows])

  const totalEnrollments = rows.length
  const averageProgress = useMemo(() => calculateAverageProgress(rows), [rows])
  const completedUsers = useMemo(
    () => rows.filter((row) => row.status === "completed").length,
    [rows],
  )

  const filteredAverageProgress = useMemo(() => calculateAverageProgress(filteredRows), [filteredRows])
  const filteredCompletedUsers = useMemo(
    () => filteredRows.filter((row) => row.status === "completed").length,
    [filteredRows],
  )

  const courseChartData = useMemo(() => buildCourseChart(filteredRows), [filteredRows])
  const activeCourseChart = useMemo(() => {
    if (courseFilter !== "all") {
      const selectedId = Number(courseFilter)
      return (
        courseChartData.find((entry) => entry.courseId === selectedId) ?? {
          courseId: selectedId,
          courseName:
            courses.find((course) => course.id === selectedId)?.title ?? `Course #${selectedId}`,
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
        }
      )
    }

    return (
      courseChartData[0] ?? {
        courseId: 0,
        courseName: "No course selected",
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
      }
    )
  }, [courseChartData, courseFilter, courses])

  const activeChartSeries = useMemo(
    () => [
      { name: "Completed", value: activeCourseChart.completed, color: "#34d399" },
      { name: "In Progress", value: activeCourseChart.inProgress, color: "#f59e0b" },
      { name: "Not Started", value: activeCourseChart.notStarted, color: "#a78bfa" },
    ],
    [activeCourseChart],
  )

  const activeCompletionRate = useMemo(() => {
    if (!activeCourseChart.total) return 0
    return Math.round((activeCourseChart.completed / activeCourseChart.total) * 100)
  }, [activeCourseChart])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  )

  if (loading) return <div className="text-gray-300">Loading enrollments...</div>

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
        <h1 className="text-3xl text-white">Enrollments</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Review learner progress filtered by category, course, and progress range with summary
          insights and a mobile-friendly progress table.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Total Enrollments" value={totalEnrollments} icon={GraduationCap} />
        <StatsCard label="Average Progress" value={`${averageProgress}%`} icon={Activity} />
        <StatsCard label="Completed Users" value={completedUsers} icon={CheckCircle2} />
      </section>

      <FilterBar
        summary={`${filteredRows.length} visible | ${filteredAverageProgress}% average progress | ${filteredCompletedUsers} completed`}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by user name"
          className="input-ui min-w-full sm:min-w-64 lg:max-w-xs"
        />

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(event) => handleCategoryChange(event.target.value)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All categories</option>
          {sortedCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Course filter — scoped to selected category */}
        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">
            {categoryFilter === "all" ? "All courses" : "All courses in category"}
          </option>
          {coursesInCategory.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <select
          value={progressFilter}
          onChange={(event) => setProgressFilter(event.target.value as ProgressFilter)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All progress</option>
          <option value="0-25">0–25%</option>
          <option value="25-50">25–50%</option>
          <option value="50-75">50–75%</option>
          <option value="75-100">75–100%</option>
          <option value="completed">Completed (100%)</option>
          <option value="in_progress">In Progress (1–99%)</option>
          <option value="not_started">Not Started (0%)</option>
        </select>
      </FilterBar>

      <EnrollmentPieChart
        title={`${activeCourseChart.courseName} Progress Mix`}
        description={
          courseFilter === "all"
            ? "Showing the most active course after the current filters."
            : "Showing progress distribution for the selected course after the current filters."
        }
        data={activeChartSeries}
        total={activeCourseChart.total}
        completionRate={activeCompletionRate}
        emptyMessage="No enrollment data is available for the current course and filters."
        metrics={[
          { label: "Completed", value: activeCourseChart.completed },
          { label: "In Progress", value: activeCourseChart.inProgress },
          { label: "Not Started", value: activeCourseChart.notStarted },
        ]}
      />

      <EnrollmentsTable rows={filteredRows} />
    </div>
  )
}
