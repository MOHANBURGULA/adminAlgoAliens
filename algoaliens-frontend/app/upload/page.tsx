"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { FileText, Send, UploadCloud, Video } from "lucide-react"
import { apiClient } from "@/lib/axios"

type Enrollment = {
  courseId: number
}

type Course = {
  id: number
  title: string
}

export default function UploadPage() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get("courseId") || "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadCourses = async () => {
      try {
        const enrollmentsRes = await apiClient.get("/api/enroll")
        const enrollments = enrollmentsRes.data as Enrollment[]

        const results = await Promise.allSettled(
          enrollments.map((entry) => apiClient.get(`/api/courses/${entry.courseId}`)),
        )

        if (!cancelled) {
          setCourses(
            results
              .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
              .map((result) => result.value.data as Course),
          )
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.response?.data?.message || "Unable to load courses.")
        }
      }
    }

    void loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async () => {
    if (!selectedCourseId || !title || !videoFile) {
      toast.error("Course, video title, and video file are required.")
      return
    }

    try {
      setSubmitting(true)

      const uploadRes = await apiClient.get(
        `/api/videos/upload-url?filename=${encodeURIComponent(videoFile.name)}`,
      )
      const { uploadUrl, key } = uploadRes.data as { uploadUrl: string; key: string }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: videoFile,
        headers: {
          "Content-Type": videoFile.type || "video/mp4",
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Unable to upload video file.")
      }

      await apiClient.post("/api/videos", {
        title,
        description,
        videoUrl: key,
      })

      const evaluationRes = await apiClient.post("/api/evaluation/submit", {
        courseId: Number(selectedCourseId),
        videoKey: key,
      })

      toast.success(
        evaluationRes.data?.message || "Video submitted and evaluation started.",
      )

      setTitle("")
      setDescription("")
      setVideoFile(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Unable to submit video.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold text-white">
        <Video size={22} className="text-purple-400" />
        Upload Explanation Video
      </h1>

      <p className="mb-8 text-gray-400">
        Upload a course explanation video and start evaluation.
      </p>

      <div className="rounded-xl border border-purple-700/30 bg-[#0f0622] p-8">
        <div className="space-y-6">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="input-ui"
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <label className="block rounded-xl border border-purple-700/30 bg-[#0a0318] p-10 text-center hover:border-purple-500">
            <div className="flex flex-col items-center gap-3">
              <UploadCloud size={22} className="text-purple-400" />
              <p className="text-sm text-gray-300">
                {videoFile ? videoFile.name : "Drop your video here or click to browse"}
              </p>
            </div>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video title"
            className="input-ui"
          />

          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description or notes"
            className="input-ui min-h-28"
          />

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 via-purple-400 to-cyan-400 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  )
}
