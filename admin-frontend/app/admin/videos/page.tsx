"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, Video, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import StatsCard from "@/components/admin/ui/StatsCard"
import FilterBar from "@/components/admin/ui/FilterBar"
import { getVideoStatusMeta } from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type Video = {
  id: number
  userId: number
  courseId?: number
  title: string
  description: string
  videoUrl: string
  status: string
  feedback?: string
  rejectionCount?: number
  createdAt?: string
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "permanently_rejected"

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Which video is currently showing the reject feedback box
  const [rejectingVideoId, setRejectingVideoId] = useState<number | null>(null)
  // Feedback text keyed by video id
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({})

  const debouncedSearch = useDebouncedValue(search, 250)

  const loadVideos = async () => {
    try {
      const response = await apiClient.get("/api/admin/videos")
      setVideos(response.data as Video[])
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await apiClient.get("/api/admin/videos")
        if (!cancelled) {
          setVideos(response.data as Video[])
          setError("")
        }
      } catch (loadError: unknown) {
        if (!cancelled) setError(getApiErrorMessage(loadError))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const pendingCount = useMemo(
    () => videos.filter((v) => v.status.toLowerCase() === "pending").length,
    [videos],
  )
  const approvedCount = useMemo(
    () => videos.filter((v) => v.status.toLowerCase() === "approved").length,
    [videos],
  )
  const rejectedCount = useMemo(
    () =>
      videos.filter(
        (v) =>
          v.status.toLowerCase() === "rejected" ||
          v.status.toLowerCase() === "permanently_rejected",
      ).length,
    [videos],
  )

  const filteredVideos = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return videos.filter((v) => {
      const matchesStatus = statusFilter === "all" || v.status.toLowerCase() === statusFilter
      const matchesSearch =
        !query ||
        v.title.toLowerCase().includes(query) ||
        String(v.userId).includes(query) ||
        (v.description ?? "").toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [videos, statusFilter, debouncedSearch])

  const approveVideo = async (id: number) => {
    setUpdatingId(id)
    try {
      await apiClient.put(`/api/admin/videos/${id}/status`, { status: "approved" })
      toast.success("Video approved — certificate auto-generated for the student")
      await loadVideos()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const confirmReject = async (id: number) => {
    const feedback = feedbackMap[id]?.trim() ?? ""
    if (!feedback) {
      toast.error("Please write feedback before rejecting.")
      return
    }
    setUpdatingId(id)
    try {
      await apiClient.put(`/api/admin/videos/${id}/status`, {
        status: "rejected",
        feedback,
      })
      toast.success("Video rejected and feedback sent to student")
      setRejectingVideoId(null)
      setFeedbackMap((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadVideos()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const cancelReject = (id: number) => {
    setRejectingVideoId(null)
    setFeedbackMap((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  if (loading) return <div className="text-gray-300">Loading video reviews...</div>

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
        <h1 className="text-3xl font-semibold text-white">Video Reviews</h1>
        <p className="mt-2 text-sm text-gray-400">
          Review explanation videos submitted by students. Approving a video automatically
          generates a certificate. Rejecting requires feedback for the student.
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Videos" value={videos.length} icon={Video} />
        <StatsCard label="Pending" value={pendingCount} icon={Clock} />
        <StatsCard label="Approved" value={approvedCount} icon={CheckCircle2} />
        <StatsCard label="Rejected" value={rejectedCount} icon={XCircle} />
      </section>

      {/* Filters */}
      <FilterBar summary={`${filteredVideos.length} of ${videos.length} videos shown`}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or user ID"
          className="input-ui min-w-full sm:min-w-64 lg:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="permanently_rejected">Permanently Rejected</option>
        </select>
      </FilterBar>

      {/* Video cards */}
      <div className="space-y-4">
        {filteredVideos.length === 0 ? (
          <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300">
            No videos match the current filters.
          </div>
        ) : (
          filteredVideos.map((video) => {
            const statusMeta = getVideoStatusMeta(video.status)
            const isUpdating = updatingId === video.id
            const isApproved = video.status.toLowerCase() === "approved"
            const isPermanentlyRejected = video.status.toLowerCase() === "permanently_rejected"
            const isInRejectMode = rejectingVideoId === video.id
            const feedbackText = feedbackMap[video.id] ?? ""

            const badgeColor =
              statusMeta.tone === "green"
                ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
                : statusMeta.tone === "red"
                  ? "bg-rose-500/15 text-rose-200 border-rose-500/20"
                  : statusMeta.tone === "slate"
                    ? "bg-slate-500/15 text-slate-200 border-slate-500/20"
                    : "bg-amber-500/15 text-amber-200 border-amber-500/20"

            return (
              <div
                key={video.id}
                className={`rounded-2xl border bg-[#0B0518] p-6 transition-all duration-200 ${
                  isInRejectMode
                    ? "border-rose-500/40"
                    : "border-purple-900/30"
                }`}
              >
                {/* Video info + action buttons row */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                  {/* Left: details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-white">{video.title}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeColor}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">User ID</p>
                        <p className="mt-0.5 text-white">#{video.userId}</p>
                      </div>
                      {video.courseId && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Course ID</p>
                          <p className="mt-0.5 text-white">#{video.courseId}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Submitted</p>
                        <p className="mt-0.5 text-white">{formatDate(video.createdAt)}</p>
                      </div>
                      {(video.rejectionCount ?? 0) > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Rejections</p>
                          <p className="mt-0.5 text-rose-300">{video.rejectionCount}</p>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-300">{video.description}</p>

                    {/* Previous feedback from backend */}
                    {video.feedback && !isInRejectMode && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-amber-400">Previous Feedback</p>
                        <p className="mt-1 text-sm text-amber-100">{video.feedback}</p>
                      </div>
                    )}

                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm text-indigo-300 hover:text-white"
                    >
                      Open video ↗
                    </a>
                  </div>

                  {/* Right: Approve / Reject buttons */}
                  {!isPermanentlyRejected && !isApproved && (
                    <div className="flex flex-shrink-0 flex-wrap gap-3 lg:flex-col lg:items-end">
                      {/* Approve */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => void approveVideo(video.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {isUpdating && !isInRejectMode ? "Approving..." : "Approve"}
                      </button>

                      {/* Reject — first click opens feedback box, second confirms */}
                      {!isInRejectMode ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setRejectingVideoId(video.id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => cancelReject(video.id)}
                          className="rounded-lg border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {isApproved && (
                    <div className="flex-shrink-0">
                      <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                        ✓ Approved — Certificate Generated
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Feedback box — appears below after clicking Reject ── */}
                {isInRejectMode && (
                  <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-rose-300">
                          Rejection Feedback <span className="text-rose-400">*</span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          This will be sent to User #{video.userId} so they know what to improve
                          before resubmitting.
                        </p>
                      </div>
                    </div>

                    <textarea
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      rows={4}
                      value={feedbackText}
                      onChange={(e) =>
                        setFeedbackMap((prev) => ({ ...prev, [video.id]: e.target.value }))
                      }
                      placeholder="Explain why the video is being rejected and what the student should fix before resubmitting..."
                      className="w-full rounded-lg border border-rose-500/30 bg-[#1a0a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        {feedbackText.length} characters{feedbackText.trim().length === 0 ? " — feedback required" : ""}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => cancelReject(video.id)}
                          className="rounded-lg border border-slate-600 px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || !feedbackText.trim()}
                          onClick={() => void confirmReject(video.id)}
                          className="rounded-lg bg-red-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdating ? "Rejecting..." : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
