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

type FormErrors = {
  userId?: string
  courseId?: string
}

function parsePositiveId(value: string) {
  if (!/^\d+$/.test(value.trim())) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export default function CertificatesAdminPage() {
  const [certificates, setCertificates] = useState<AdminCertificateSummary[]>([])
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [courses, setCourses] = useState<AdminCourseRecord[]>([])
  const [userId, setUserId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
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
          ? (certificatesResponse.data as AdminCertificateSummary[])
          : [],
      )
      setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserRecord[]) : [])
      setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseRecord[]) : [])
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Unable to load certificates."))
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
        const matchesCourse =
          courseFilter === "all" || String(row.courseId) === courseFilter

        return matchesSearch && matchesCourse
      })
      .sort((left, right) => {
        const leftTime = left.issuedAt ? new Date(left.issuedAt).getTime() : 0
        const rightTime = right.issuedAt ? new Date(right.issuedAt).getTime() : 0

        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime
      })
  }, [courseFilter, debouncedSearch, rows, sortOrder])

  const averageScore = useMemo(() => {
    if (!certificates.length) {
      return 0
    }

    return Math.round(
      certificates.reduce((sum, certificate) => sum + certificate.score, 0) / certificates.length,
    )
  }, [certificates])

  const recipientCount = useMemo(
    () => new Set(certificates.map((certificate) => certificate.userId)).size,
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

    if (nextErrors.userId || nextErrors.courseId) {
      return null
    }

    return {
      userId: parsedUserId as number,
      courseId: parsedCourseId as number,
    } as const
  }

  const issueCertificate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedValues = validateIssueForm()

    if (!parsedValues) {
      return
    }

    setIssuing(true)

    try {
      await apiClient.post("/api/admin/certificates/release", parsedValues)
      toast.success("Certificate issued")
      setUserId("")
      setCourseId("")
      setFormErrors({})
      await loadCertificates()
    } catch (issueError: unknown) {
      toast.error(getApiErrorMessage(issueError, "Unable to issue certificate."))
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return <div className="text-gray-300">Loading certificates...</div>
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
        <h1 className="text-3xl text-white">Certificates</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Issue certificates manually, validate IDs before submission, and monitor release history
          in a sortable admin table.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Issued" value={certificates.length} icon={Award} />
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
          placeholder="Search by user ID"
          className="input-ui min-w-full sm:min-w-56 lg:max-w-xs"
        />

        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All course IDs</option>
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

      <CertificatesTable rows={filteredRows} />
    </div>
  )
}
