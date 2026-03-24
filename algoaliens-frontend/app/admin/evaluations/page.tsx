"use client"

import { useEffect, useMemo, useState } from "react"
import EnrollmentPieChart from "@/components/admin/charts/EnrollmentPieChart"
import EvaluationTable from "@/components/admin/tables/EvaluationTable"
import FilterBar from "@/components/admin/ui/FilterBar"
import {
  type AdminCourseSummary,
  type AdminEvaluationRecord,
  type AdminUserSummary,
  buildEvaluationStatusChartData,
  buildEvaluationTableRows,
  type EvaluationDisplayStatus,
} from "@/lib/admin-dashboard"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

export default function AdminEvaluationsPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [courses, setCourses] = useState<AdminCourseSummary[]>([])
  const [evaluations, setEvaluations] = useState<AdminEvaluationRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | EvaluationDisplayStatus>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadEvaluations = async () => {
      try {
        const [usersResponse, coursesResponse, evaluationsResponse] = await Promise.all([
          apiClient.get("/api/admin/users"),
          apiClient.get("/api/admin/courses"),
          apiClient.get("/api/admin/evaluations"),
        ])

        if (cancelled) {
          return
        }

        setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserSummary[]) : [])
        setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseSummary[]) : [])
        setEvaluations(
          Array.isArray(evaluationsResponse.data)
            ? (evaluationsResponse.data as AdminEvaluationRecord[])
            : [],
        )
        setError("")
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Unable to load evaluations."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadEvaluations()

    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(
    () => buildEvaluationTableRows(evaluations, users, courses),
    [courses, evaluations, users],
  )
  const filteredRows = useMemo(
    () => rows.filter((row) => statusFilter === "all" || row.status === statusFilter),
    [rows, statusFilter],
  )
  const chartData = useMemo(
    () => buildEvaluationStatusChartData(evaluations),
    [evaluations],
  )
  const statusCounts = useMemo(
    () => ({
      passed: rows.filter((row) => row.status === "passed").length,
      failed: rows.filter((row) => row.status === "failed").length,
      pending: rows.filter((row) => row.status === "pending").length,
    }),
    [rows],
  )

  if (loading) {
    return <div className="text-gray-300">Loading evaluations...</div>
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
        <h1 className="text-3xl font-semibold text-white">Evaluations</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Review learner outcomes, filter by status, and keep an eye on flagged submissions from a
          single responsive workspace.
        </p>
      </div>

      <FilterBar
        summary={`${filteredRows.length} of ${rows.length} evaluations shown • ${statusCounts.passed} passed • ${statusCounts.pending} pending`}
      >
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | EvaluationDisplayStatus)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </FilterBar>

      <div className="max-w-md">
        <EnrollmentPieChart
          title="Evaluation Outcomes"
          description="Passed, failed, and pending evaluation results across the platform."
          data={chartData}
          total={rows.length}
          metrics={[
            { label: "Passed", value: statusCounts.passed },
            { label: "Failed", value: statusCounts.failed },
            { label: "Pending", value: statusCounts.pending },
          ]}
          emptyMessage="Evaluations will appear here once learners submit their videos."
        />
      </div>

      <EvaluationTable rows={filteredRows} />
    </div>
  )
}
