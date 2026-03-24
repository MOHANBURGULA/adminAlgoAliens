"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

type Video = {
  id: number
  userId: number
  title: string
  description: string
  videoUrl: string
  status: string
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadVideos = async () => {
      try {
        const response = await apiClient.get("/api/admin/videos")

        if (!cancelled) {
          setVideos(response.data as Video[])
          setError("")
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Unable to load videos."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadVideos()

    return () => {
      cancelled = true
    }
  }, [])

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiClient.put(`/api/admin/videos/${id}/status`, { status })
      const response = await apiClient.get("/api/admin/videos")
      setVideos(response.data as Video[])
      toast.success(`Video ${status}`)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update video."))
    }
  }

  if (loading) {
    return <div className="text-gray-300">Loading video reviews...</div>
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
        <h1 className="text-3xl font-semibold text-white">Video Reviews</h1>
        <p className="mt-2 text-sm text-gray-400">
          Review explanation videos submitted by students.
        </p>
      </div>

      <div className="space-y-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{video.title}</h2>
                <p className="mt-2 text-sm text-gray-400">User ID: {video.userId}</p>
                <p className="mt-2 text-sm text-gray-300">{video.description}</p>
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-sm text-cyan-300 hover:text-white"
                >
                  Open video
                </a>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[#12092A] px-3 py-2 text-sm text-white">
                  {video.status}
                </span>
                <button
                  type="button"
                  onClick={() => void updateStatus(video.id, "approved")}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(video.id, "rejected")}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
