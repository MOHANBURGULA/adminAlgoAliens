"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import { BookOpen, FileText, Github, Send, UploadCloud } from "lucide-react"
import { getApiErrorMessage } from "@/lib/http"
import {
  fetchCourse,
  fetchEnrollments,
  fetchFinalQuizAttempts,
  fetchProjects,
  submitProjectSubmission,
  type ProjectSubmission,
  uploadProjectZip,
} from "@/lib/learning"

type CourseOption = {
  id: number
  title: string
}

function projectTone(status: "approved" | "pending" | "rejected") {
  if (status === "approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
  }

  if (status === "rejected") {
    return "border-red-500/20 bg-red-500/10 text-red-100"
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-100"
}

function ProjectsPageContent() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(
    searchParams?.get("courseId") || "",
  )
  const [githubLink, setGithubLink] = useState("")
  const [description, setDescription] = useState("")
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [projects, setProjects] = useState<ProjectSubmission[]>([])
  const [finalQuizPassed, setFinalQuizPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courseStatusLoading, setCourseStatusLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadBaseData = async () => {
    const [enrollments, submissions] = await Promise.all([
      fetchEnrollments(),
      fetchProjects(),
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
    setProjects(submissions)
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        await loadBaseData()
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Unable to load project submissions."))
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
      setFinalQuizPassed(false)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        setCourseStatusLoading(true)
        const attempts = await fetchFinalQuizAttempts(Number(selectedCourseId))

        if (!cancelled) {
          setFinalQuizPassed(attempts.some((attempt) => attempt.passed))
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Unable to load final quiz status for this course."),
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

  const filteredProjects = useMemo(() => {
    if (!selectedCourseId) {
      return [...projects].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
    }

    return [...projects]
      .filter((project) => String(project.courseId) === selectedCourseId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
  }, [projects, selectedCourseId])

  const handleSubmit = async () => {
    if (!selectedCourseId || !githubLink.trim() || !description.trim()) {
      toast.error("Course, GitHub link, and description are required.")
      return
    }

    if (!finalQuizPassed) {
      toast.error("Pass the final MCQ test before submitting your project.")
      return
    }

    try {
      setSubmitting(true)
      const uploadedZip = zipFile ? await uploadProjectZip(zipFile) : null

      await submitProjectSubmission({
        courseId: Number(selectedCourseId),
        githubLink: githubLink.trim(),
        description: description.trim(),
        zipFile: uploadedZip?.key,
      })

      toast.success("Project submitted for review.")
      setGithubLink("")
      setDescription("")
      setZipFile(null)
      await loadBaseData()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit project."))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading project submissions...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Project Submission</h1>
          <p className="mt-2 text-sm text-gray-400">
            Submit your course project with the live ZIP upload and project APIs.
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
          submitting your project.
        </div>
      ) : null}

      <div className="space-y-5 rounded-[28px] border border-white/10 bg-[#0f0622] p-6">
        <div className="rounded-2xl border border-white/10 bg-[#12092A] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-purple-300">
            <BookOpen size={16} />
            Select Course
          </div>
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12092A] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
            <Github size={16} />
            GitHub Repository
          </div>
          <input
            value={githubLink}
            onChange={(event) => setGithubLink(event.target.value)}
            placeholder="https://github.com/username/repo-name"
            className="input-ui"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12092A] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
            <UploadCloud size={16} />
            Upload ZIP File
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(event) => setZipFile(event.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-purple-500/20 py-8 text-center text-sm text-gray-400 transition hover:border-purple-400"
          >
            {zipFile ? zipFile.name : "Drop ZIP file or click to browse"}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12092A] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
            <FileText size={16} />
            Project Description
          </div>
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your solution and implementation details."
            className="input-ui min-h-32"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || courseStatusLoading || !selectedCourseId || !finalQuizPassed}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} />
          {submitting ? "Submitting..." : "Submit Project"}
        </button>
      </div>

      <section className="rounded-[28px] border border-white/10 bg-[#0B0518] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Project History</h2>
            <p className="mt-2 text-sm text-gray-400">
              {selectedCourse
                ? `Showing submissions for ${selectedCourse.title}.`
                : "Showing all of your submitted projects."}
            </p>
          </div>
          {courseStatusLoading ? (
            <span className="text-sm text-gray-400">Refreshing...</span>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#12092A] p-5 text-sm text-gray-300">
              No project submissions yet.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#12092A] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{project.githubLink}</p>
                  <p className="mt-1 text-sm text-gray-400">{project.description}</p>
                  {project.feedback ? (
                    <p className="mt-2 text-sm text-gray-300">{project.feedback}</p>
                  ) : null}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${projectTone(
                    project.status === "approved"
                      ? "approved"
                      : project.status === "rejected"
                        ? "rejected"
                        : "pending",
                  )}`}
                >
                  {project.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-gray-300">
          Loading project submissions...
        </div>
      }
    >
      <ProjectsPageContent />
    </Suspense>
  )
}
