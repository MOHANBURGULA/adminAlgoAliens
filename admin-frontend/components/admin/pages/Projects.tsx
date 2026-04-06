"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import ProjectsTable from "@/components/admin/tables/ProjectsTable"
import FilterBar from "@/components/admin/ui/FilterBar"
import StatsCard from "@/components/admin/ui/StatsCard"
import {
  buildCourseMap,
  type AdminCourseRecord,
  type AdminProjectRecord,
} from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type ProjectStatusFilter = "all" | "pending" | "approved" | "rejected"

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<AdminProjectRecord[]>([])
  const [courses, setCourses] = useState<AdminCourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all")
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const debouncedSearch = useDebouncedValue(search, 250)

  const loadProjects = async () => {
    try {
      const [projectsResponse, coursesResponse] = await Promise.all([
        apiClient.get("/api/admin/projects"),
        apiClient.get("/api/admin/courses"),
      ])

      setProjects(
        Array.isArray(projectsResponse.data) ? (projectsResponse.data as AdminProjectRecord[]) : [],
      )
      setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseRecord[]) : [])
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Unable to load projects."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const courseMap = useMemo(() => buildCourseMap(courses), [courses])

  const filteredProjects = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return projects.filter((project) => {
      const normalizedStatus = project.status.trim().toLowerCase()
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter
      const matchesSearch =
        !query ||
        String(project.id).includes(query) ||
        String(project.userId).includes(query) ||
        String(project.courseId).includes(query) ||
        project.githubLink.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [debouncedSearch, projects, statusFilter])

  const pendingCount = useMemo(
    () => projects.filter((project) => project.status.trim().toLowerCase() === "pending").length,
    [projects],
  )
  const approvedCount = useMemo(
    () => projects.filter((project) => project.status.trim().toLowerCase() === "approved").length,
    [projects],
  )
  const rejectedCount = useMemo(
    () => projects.filter((project) => project.status.trim().toLowerCase() === "rejected").length,
    [projects],
  )

  const updateStatus = async (project: AdminProjectRecord, status: "approved" | "rejected") => {
    const feedback = feedbackDrafts[project.id]?.trim()

    setSavingId(project.id)

    try {
      await apiClient.put(`/api/admin/projects/${project.id}/status`, {
        status,
        feedback:
          status === "rejected"
            ? feedback || "Please improve the submission details."
            : feedback || undefined,
      })
      toast.success(`Project ${status}`)
      setFeedbackDrafts((current) => {
        const nextDrafts = { ...current }
        delete nextDrafts[project.id]
        return nextDrafts
      })
      await loadProjects()
    } catch (updateError: unknown) {
      toast.error(getApiErrorMessage(updateError, "Unable to update project."))
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return <div className="text-gray-300">Loading project reviews...</div>
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
        <h1 className="text-3xl text-white">Project Reviews</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Moderate project submissions with clearer status handling, optional rejection feedback,
          and responsive review controls.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Pending" value={pendingCount} icon={Clock3} />
        <StatsCard label="Approved" value={approvedCount} icon={CheckCircle2} />
        <StatsCard label="Rejected" value={rejectedCount} icon={XCircle} />
      </section>

      <FilterBar summary={`${filteredProjects.length} of ${projects.length} projects shown`}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by project ID, user ID, repo, or description"
          className="input-ui min-w-full sm:min-w-72 lg:max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </FilterBar>

      <ProjectsTable
        projects={filteredProjects}
        courseMap={courseMap}
        feedbackDrafts={feedbackDrafts}
        savingId={savingId}
        onFeedbackChange={(projectId, value) =>
          setFeedbackDrafts((current) => ({
            ...current,
            [projectId]: value,
          }))
        }
        onApprove={(project) => void updateStatus(project, "approved")}
        onReject={(project) => void updateStatus(project, "rejected")}
      />
    </div>
  )
}
