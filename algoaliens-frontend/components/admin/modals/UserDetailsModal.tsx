"use client"

import { useEffect, useMemo, useState } from "react"
import { Award, BookOpen, ShieldCheck, X } from "lucide-react"
import Badge from "@/components/admin/ui/Badge"
import Button from "@/components/admin/ui/Button"
import ProgressBar from "@/components/admin/ui/ProgressBar"
import {
  formatAdminDate,
  getCourseLabel,
  getRoleMeta,
  type AdminUserDetails,
} from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

type TabKey = "enrollments" | "evaluations" | "certificates"

type UserDetailsModalProps = {
  open: boolean
  userId: number | null
  onClose: () => void
  courseMap: Record<number, string>
}

function getEvaluationTone(status: string) {
  const normalized = status.trim().toLowerCase()

  if (normalized === "passed") {
    return "green" as const
  }

  if (normalized === "failed") {
    return "red" as const
  }

  return "yellow" as const
}

export default function UserDetailsModal({
  open,
  userId,
  onClose,
  courseMap,
}: UserDetailsModalProps) {
  const [user, setUser] = useState<AdminUserDetails | null>(null)
  const [tab, setTab] = useState<TabKey>("enrollments")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !userId) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError("")

    const loadUser = async () => {
      try {
        const response = await apiClient.get(`/api/admin/users/${userId}`)

        if (!cancelled) {
          setUser(response.data as AdminUserDetails)
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Unable to load user details."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [open, userId])

  useEffect(() => {
    if (!open) {
      setTab("enrollments")
      setUser(null)
      setError("")
    }
  }, [open])

  const tabCounts = useMemo(
    () => ({
      enrollments: user?.enrollments.length ?? 0,
      evaluations: user?.evaluations.length ?? 0,
      certificates: user?.certificates.length ?? 0,
    }),
    [user],
  )

  if (!open) {
    return null
  }

  const roleMeta = user ? getRoleMeta(user.role) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-purple-900/30 bg-[#090413] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-purple-900/20 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">User Details</p>
            <h2 className="mt-2 text-2xl text-white">{user?.name ?? `User #${userId}`}</h2>
            {user ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-300">
                <span>{user.email}</span>
                {roleMeta ? <Badge tone={roleMeta.tone}>{roleMeta.label}</Badge> : null}
                <span>Joined {formatAdminDate(user.createdAt)}</span>
              </div>
            ) : null}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close user details">
            <X size={18} />
          </Button>
        </div>

        <div className="border-b border-purple-900/20 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={tab === "enrollments" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setTab("enrollments")}
            >
              <BookOpen size={16} />
              Enrollments ({tabCounts.enrollments})
            </Button>
            <Button
              variant={tab === "evaluations" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setTab("evaluations")}
            >
              <ShieldCheck size={16} />
              Evaluations ({tabCounts.evaluations})
            </Button>
            <Button
              variant={tab === "certificates" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setTab("certificates")}
            >
              <Award size={16} />
              Certificates ({tabCounts.certificates})
            </Button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
          {loading ? <div className="text-gray-300">Loading user details...</div> : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-100">
              {error}
            </div>
          ) : null}

          {!loading && !error && user && tab === "enrollments" ? (
            user.enrollments.length ? (
              <div className="space-y-4">
                {user.enrollments.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base text-white">
                          {getCourseLabel(entry.courseId, courseMap)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          Enrolled on {formatAdminDate(entry.createdAt)}
                        </p>
                      </div>
                      <Badge tone={entry.progress >= 100 ? "green" : entry.progress > 0 ? "yellow" : "slate"}>
                        {entry.progress >= 100 ? "Completed" : entry.progress > 0 ? "In Progress" : "Not Started"}
                      </Badge>
                    </div>
                    <ProgressBar value={entry.progress} className="mt-4" />
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0B0518] p-6 text-gray-400">
                No enrollments found for this user.
              </div>
            )
          ) : null}

          {!loading && !error && user && tab === "evaluations" ? (
            user.evaluations.length ? (
              <div className="space-y-4">
                {user.evaluations.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base text-white">
                          {getCourseLabel(entry.courseId, courseMap)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          Score {entry.finalScore ?? "Pending"} • AI {entry.aiDetectionScore ?? "N/A"}
                        </p>
                      </div>
                      <Badge tone={getEvaluationTone(entry.status)}>{entry.status}</Badge>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0B0518] p-6 text-gray-400">
                No evaluations found for this user.
              </div>
            )
          ) : null}

          {!loading && !error && user && tab === "certificates" ? (
            user.certificates.length ? (
              <div className="space-y-4">
                {user.certificates.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base text-white">
                          {getCourseLabel(entry.courseId, courseMap)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          Issued on {formatAdminDate(entry.issuedAt)}
                        </p>
                      </div>
                      <Badge tone="green">Score {entry.score}</Badge>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0B0518] p-6 text-gray-400">
                No certificates found for this user.
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
