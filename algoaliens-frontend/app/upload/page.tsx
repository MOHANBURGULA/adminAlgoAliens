"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { PlayCircle, Send, UploadCloud, Video } from "lucide-react"
import { getApiErrorMessage } from "@/lib/http"
import {
  createVideoRecord,
  fetchCourse,
  fetchEnrollments,
  fetchEvaluationAttempts,
  fetchFinalQuizAttempts,
  fetchVideos,
  submitEvaluation,
  type EvaluationAttempt,
  type UserVideo,
  uploadExplanationVideo,
} from "@/lib/learning"

type CourseOption = {
  id: number
  title: string
}

function reviewTone(status: "approved" | "review" | "retry") {
  if (status === "approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
  }

  if (status === "retry") {
    return "border-red-500/20 bg-red-500/10 text-red-100"
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-100"
}

export default function UploadPage() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(
    searchParams?.get("courseId") || "",
  )
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videos, setVideos] = useState<UserVideo[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationAttempt[]>([])
  const [finalQuizPassed, setFinalQuizPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courseStatusLoading, setCourseStatusLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadBaseData = async () => {
    const [enrollments, userVideos] = await Promise.all([
      fetchEnrollments(),
      fetchVideos(),
    ])

    const courseResults = await Promise.allSettled(
      enrollments.map((enrollment) => fetchCourse(enrollment.courseId)),
    )

    setCourses(
      courseResults.flatMap((result) =>
        result.status === "fulfilled"
          ? [
              {
                id: result.value.id,
                title: result.value.title,
              },
            ]
          : [],
      ),
    )
    setVideos(userVideos)
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        await loadBaseData()
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Unable to load your upload page."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedCourseId) {
      setEvaluations([])
      setFinalQuizPassed(false)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        setCourseStatusLoading(true)
        const courseId = Number(selectedCourseId)
        const [attempts, courseEvaluations] = await Promise.all([
          fetchFinalQuizAttempts(courseId),
          fetchEvaluationAttempts(courseId),
        ])

        if (cancelled) {
          return
        }

        setFinalQuizPassed(attempts.some((attempt) => attempt.passed))
        setEvaluations(
          [...courseEvaluations].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          ),
        )
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Unable to load the course upload status."),
          )
        }
      } finally {
        if (!cancelled) {
          setCourseStatusLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [selectedCourseId])

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === selectedCourseId) || null,
    [courses, selectedCourseId],
  )

  const selectedCourseEntries = useMemo(
    () =>
      evaluations
        .map((evaluation) => ({
          evaluation,
          video:
            videos.find((video) => video.videoUrl === evaluation.videoKey) || null,
        }))
        .sort(
          (left, right) =>
            new Date(right.evaluation.createdAt).getTime() -
            new Date(left.evaluation.createdAt).getTime(),
        ),
    [evaluations, videos],
  )

  const allVideosSorted = useMemo(
    () =>
      [...videos].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [videos],
  )

  const handleSubmit = async () => {
    if (!selectedCourseId || !title.trim() || !videoFile) {
      toast.error("Course, title, and video file are required.")
      return
    }

    if (!finalQuizPassed) {
      toast.error("Pass the final MCQ test before uploading your explanation video.")
      return
    }

    try {
      setSubmitting(true)
      const upload = await uploadExplanationVideo(videoFile)

      await createVideoRecord({
        title: title.trim(),
        description: description.trim(),
        videoUrl: upload.key,
      })

      const evaluation = await submitEvaluation({
        courseId: Number(selectedCourseId),
        videoKey: upload.key,
      })

      toast.success(evaluation.message || "Video uploaded and sent for review.")
      setTitle("")
      setDescription("")
      setVideoFile(null)
      await loadBaseData()

      if (selectedCourseId) {
        const courseId = Number(selectedCourseId)
        const refreshedEvaluations = await fetchEvaluationAttempts(courseId)
        setEvaluations(
          [...refreshedEvaluations].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          ),
        )
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit video."))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading video submissions...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <Video size={22} className="text-purple-400" />
            Upload Explanation Video
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Use the live upload URL flow, save the video record, and start the
            evaluation pipeline from the existing backend APIs.
          </p>
        </div>

        {selectedCourseId ? (
          <Link
            href={`/courses/${selectedCourseId}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]"
          >
            Back to course
          </Link>
        ) : null}
      </div>

      {!finalQuizPassed && selectedCourseId ? (
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-100">
          Pass the final MCQ test in {selectedCourse?.title || "this course"} before
          uploading your explanation video.
        </div>
      ) : null}

      <div className="rounded-[28px] border border-white/10 bg-[#0f0622] p-6">
        <div className="space-y-5">
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="input-ui"
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <label className="block rounded-2xl border border-dashed border-purple-500/20 bg-[#0B0518] p-10 text-center transition hover:border-purple-400">
            <div className="flex flex-col items-center gap-3">
              <UploadCloud size={22} className="text-purple-300" />
              <p className="text-sm text-gray-300">
                {videoFile ? videoFile.name : "Drop your video here or click to browse"}
              </p>
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Video title"
            className="input-ui"
          />

          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description or review notes"
            className="input-ui min-h-28"
          />

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              submitting || courseStatusLoading || !selectedCourseId || !finalQuizPassed
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>

      <section className="rounded-[28px] border border-white/10 bg-[#0B0518] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Video Submissions</h2>
            <p className="mt-2 text-sm text-gray-400">
              {selectedCourse
                ? `Showing uploads for ${selectedCourse.title}.`
                : "Showing all of your uploaded videos."}
            </p>
          </div>
          {courseStatusLoading ? (
            <span className="text-sm text-gray-400">Refreshing...</span>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {selectedCourseId && selectedCourseEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#12092A] p-5 text-sm text-gray-300">
              No video submissions yet.
            </div>
          ) : selectedCourseId ? (
            selectedCourseEntries.map((entry) => {
              const state =
                entry.video?.status === "approved" || entry.evaluation.status === "passed"
                  ? { label: "Approved", tone: "approved" as const }
                  : entry.evaluation.status === "failed"
                    ? { label: "Needs Retry", tone: "retry" as const }
                    : { label: "Under Review", tone: "review" as const }

              return (
                <div
                  key={entry.evaluation.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#12092A] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <PlayCircle className="mt-1 text-cyan-300" size={18} />
                    <div>
                      <p className="font-medium text-white">
                        {entry.video?.title || `Video attempt #${entry.evaluation.id}`}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {entry.video?.description || "Evaluation submitted from the upload flow."}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                        Evaluation status: {entry.evaluation.status}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${reviewTone(
                      state.tone,
                    )}`}
                  >
                    {state.label}
                  </span>
                </div>
              )
            })
          ) : allVideosSorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#12092A] p-5 text-sm text-gray-300">
              No video submissions yet.
            </div>
          ) : (
            allVideosSorted.map((video) => {
              const state =
                video.status === "approved"
                  ? { label: "Approved", tone: "approved" as const }
                  : { label: "Under Review", tone: "review" as const }

              return (
                <div
                  key={video.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#12092A] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <PlayCircle className="mt-1 text-cyan-300" size={18} />
                    <div>
                      <p className="font-medium text-white">{video.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{video.description}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${reviewTone(
                      state.tone,
                    )}`}
                  >
                    {state.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
