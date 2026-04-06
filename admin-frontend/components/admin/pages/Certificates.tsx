"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Award, Medal, UserCheck } from "lucide-react"
import toast from "react-hot-toast"
import CertificatesTable, {
  type CertificateTableRow,
} from "@/components/admin/tables/CertificatesTable"
import Button from "@/components/admin/ui/Button"
import Card from "@/components/admin/ui/Card"
import FilterBar from "@/components/admin/ui/FilterBar"
import StatsCard from "@/components/admin/ui/StatsCard"
import {
  buildCourseMap,
  getCourseLabel,
  type AdminCertificateSummary,
  type AdminCourseRecord,
  type AdminUserRecord,
} from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type SortOrder = "newest" | "oldest"
type StatusFilter = "all" | "approved" | "pending" | "rejected"

type FormErrors = {
  userId?: string
  courseId?: string
}

// Extended certificate type that includes approval status
type AdminCertificateWithStatus = AdminCertificateSummary & {
  status?: string
  approvedAt?: string
}

function parsePositiveId(value: string) {
  if (!/^\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function getStatusBadge(status?: string) {
  const normalized = (status ?? "pending").toLowerCase()
  if (normalized === "approved") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-500/20">
        Approved
      </span>
    )
  }
  if (normalized === "rejected") {
    return (
      <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-200 border border-rose-500/20">
        Rejected
      </span>
    )
  }
  return (
    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200 border border-amber-500/20">
      Pending
    </span>
  )
}

export default function CertificatesAdminPage() {
  const [certificates, setCertificates] = useState<AdminCertificateWithStatus[]>([])
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [courses, setCourses] = useState<AdminCourseRecord[]>([])
  const [userId, setUserId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const debouncedSearch = useDebouncedValue(search, 250)

  const loadCertificates = async () => {
    try {
      const [certificatesResponse, usersResponse, coursesResponse] = await Promise.all([
        apiClient.get("/api/admin/certificates"),
        apiClient.get("/api/admin/users"),
        apiClient.get("/api/admin/courses"),
      ])

      setCertificates(
        Array.isArray(certificatesResponse.data)
          ? (certificatesResponse.data as AdminCertificateWithStatus[])
          : [],
      )
      setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserRecord[]) : [])
      setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseRecord[]) : [])
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCertificates()
  }, [])

  const courseMap = useMemo(() => buildCourseMap(courses), [courses])
  const userMap = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.name])) as Record<number, string>,
    [users],
  )
  const sortedCourses = useMemo(
    () => [...courses].sort((left, right) => left.title.localeCompare(right.title)),
    [courses],
  )

  const rows = useMemo(
    () =>
      certificates.map((certificate) => ({
        ...certificate,
        userName: userMap[certificate.userId] ?? `User #${certificate.userId}`,
        courseName: getCourseLabel(certificate.courseId, courseMap),
      })) satisfies CertificateTableRow[],
    [certificates, courseMap, userMap],
  )

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return [...rows]
      .filter((row) => {
        const matchesSearch =
          !query ||
          String(row.userId).includes(query) ||
          row.userName.toLowerCase().includes(query) ||
          String(row.courseId).includes(query) ||
          row.courseName.toLowerCase().includes(query)
        const matchesCourse = courseFilter === "all" || String(row.courseId) === courseFilter
        const matchesStatus =
          statusFilter === "all" ||
          (row as AdminCertificateWithStatus).status?.toLowerCase() === statusFilter ||
          (statusFilter === "pending" && !(row as AdminCertificateWithStatus).status)

        return matchesSearch && matchesCourse && matchesStatus
      })
      .sort((left, right) => {
        const leftTime = left.issuedAt ? new Date(left.issuedAt).getTime() : 0
        const rightTime = right.issuedAt ? new Date(right.issuedAt).getTime() : 0
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime
      })
  }, [courseFilter, debouncedSearch, rows, sortOrder, statusFilter])

  const averageScore = useMemo(() => {
    if (!certificates.length) return 0
    return Math.round(
      certificates.reduce((sum, certificate) => sum + certificate.score, 0) / certificates.length,
    )
  }, [certificates])

  const recipientCount = useMemo(
    () => new Set(certificates.map((certificate) => certificate.userId)).size,
    [certificates],
  )

  const approvedCount = useMemo(
    () => certificates.filter((c) => c.status?.toLowerCase() === "approved").length,
    [certificates],
  )

  const validateIssueForm = () => {
    const nextErrors: FormErrors = {}
    const parsedUserId = parsePositiveId(userId)
    const parsedCourseId = parsePositiveId(courseId)

    if (parsedUserId === null) {
      nextErrors.userId = "Enter a valid numeric user ID."
    } else if (!users.some((user) => user.id === parsedUserId)) {
      nextErrors.userId = "This user ID does not exist in the current admin list."
    }

    if (parsedCourseId === null) {
      nextErrors.courseId = "Enter a valid numeric course ID."
    } else if (!courses.some((course) => course.id === parsedCourseId)) {
      nextErrors.courseId = "This course ID does not exist in the current admin list."
    }

    setFormErrors(nextErrors)
    if (nextErrors.userId || nextErrors.courseId) return null

    return {
      userId: parsedUserId as number,
      courseId: parsedCourseId as number,
    } as const
  }

  const issueCertificate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedValues = validateIssueForm()
    if (!parsedValues) return

    setIssuing(true)
    try {
      await apiClient.post("/api/admin/certificates/release", parsedValues)
      toast.success("Certificate issued")
      setUserId("")
      setCourseId("")
      setFormErrors({})
      await loadCertificates()
    } catch (issueError: unknown) {
      toast.error(getApiErrorMessage(issueError))
    } finally {
      setIssuing(false)
    }
  }

  const approveCertificate = async (certId: number) => {
    setApprovingId(certId)
    try {
      await apiClient.put(`/api/admin/certificates/${certId}/approve`)
      toast.success("Certificate approved")
      await loadCertificates()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err,))
    } finally {
      setApprovingId(null)
    }
  }

  const rejectCertificate = async (certId: number) => {
    setRejectingId(certId)
    try {
      await apiClient.put(`/api/admin/certificates/${certId}/reject`)
      toast.success("Certificate rejected")
      await loadCertificates()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err,))
    } finally {
      setRejectingId(null)
    }
  }

  if (loading) return <div className="text-gray-300">Loading certificates...</div>

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
        <h1 className="text-3xl text-white">Certificates</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Issue, approve, or reject certificates. Certificates are also auto-generated when a
          student&apos;s video is approved.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Issued" value={certificates.length} icon={Award} />
        <StatsCard label="Approved" value={approvedCount} icon={Award} />
        <StatsCard label="Recipients" value={recipientCount} icon={UserCheck} />
        <StatsCard label="Average Score" value={`${averageScore}`} icon={Medal} />
      </section>

      <Card
        title="Issue Certificate"
        description="Use verified admin IDs to issue a certificate without changing the existing backend flow."
      >
        <form onSubmit={issueCertificate} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="certificate-user-id" className="text-sm text-gray-300">
              User ID
            </label>
            <input
              id="certificate-user-id"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value)
                setFormErrors((current) => ({ ...current, userId: undefined }))
              }}
              placeholder="Enter user ID"
              className="input-ui mt-2"
              list="admin-user-suggestions"
              required
            />
            <datalist id="admin-user-suggestions">
              {users.map((user) => (
                <option key={user.id} value={String(user.id)} label={user.name} />
              ))}
            </datalist>
            {formErrors.userId ? (
              <p className="mt-2 text-sm text-rose-200">{formErrors.userId}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="certificate-course-id" className="text-sm text-gray-300">
              Course ID
            </label>
            <input
              id="certificate-course-id"
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value)
                setFormErrors((current) => ({ ...current, courseId: undefined }))
              }}
              placeholder="Enter course ID"
              className="input-ui mt-2"
              list="admin-course-suggestions"
              required
            />
            <datalist id="admin-course-suggestions">
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)} label={course.title} />
              ))}
            </datalist>
            {formErrors.courseId ? (
              <p className="mt-2 text-sm text-rose-200">{formErrors.courseId}</p>
            ) : null}
          </div>

          <Button type="submit" variant="primary" className="w-full lg:w-auto lg:self-end" disabled={issuing}>
            {issuing ? "Issuing..." : "Issue Certificate"}
          </Button>
        </form>
      </Card>

      <FilterBar summary={`${filteredRows.length} of ${rows.length} certificates shown`}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by user or course"
          className="input-ui min-w-full sm:min-w-56 lg:max-w-xs"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="input-ui min-w-full sm:min-w-44 lg:max-w-xs"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All courses</option>
          {sortedCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} (#{course.id})
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </FilterBar>

      {/* Certificates list with approve/reject actions */}
      <div className="space-y-4">
        {filteredRows.length === 0 ? (
          <div className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300">
            No certificates match the current filters.
          </div>
        ) : (
          filteredRows.map((row) => {
            const cert = row as AdminCertificateWithStatus
            const status = cert.status?.toLowerCase() ?? "pending"
            const isApproving = approvingId === row.id
            const isRejecting = rejectingId === row.id

            return (
              <div
                key={row.id}
                className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-5 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-white">
                        Certificate #{row.id}
                      </h3>
                      {getStatusBadge(cert.status)}
                    </div>
                    <p className="text-sm text-gray-400">
                      <span className="text-white">{row.userName}</span> · User #{row.userId}
                    </p>
                    <p className="text-sm text-gray-400">
                      Course: <span className="text-white">{row.courseName}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Score:{" "}
                      <span
                        className={`font-medium ${row.score >= 90 ? "text-emerald-300" : row.score >= 60 ? "text-amber-300" : "text-rose-300"}`}
                      >
                        {row.score}
                      </span>
                    </p>
                    {row.issuedAt && (
                      <p className="text-xs text-gray-500">Issued: {row.issuedAt}</p>
                    )}
                  </div>

                  {status !== "approved" && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isApproving || isRejecting}
                        onClick={() => void approveCertificate(row.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {isApproving ? "Approving..." : "Approve"}
                      </button>
                      {status !== "rejected" && (
                        <button
                          type="button"
                          disabled={isApproving || isRejecting}
                          onClick={() => void rejectCertificate(row.id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {isRejecting ? "Rejecting..." : "Reject"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <CertificatesTable rows={filteredRows} />
    </div>
  )
}
