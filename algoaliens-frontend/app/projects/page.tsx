"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { BookOpen, FileText, Github, Send, UploadCloud } from "lucide-react"
import { apiClient } from "@/lib/axios"

type Enrollment = {
  courseId: number
}

type Course = {
  id: number
  title: string
}

export default function ProjectsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get("courseId") || "")
  const [githubLink, setGithubLink] = useState("")
  const [description, setDescription] = useState("")
  const [zipFile, setZipFile] = useState<File | null>(null)
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
          toast.error(error?.response?.data?.message || "Unable to load enrolled courses.")
        }
      }
    }

    void loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === selectedCourseId),
    [courses, selectedCourseId],
  )

  const handleSubmit = async () => {
    if (!selectedCourseId || !githubLink || !description) {
      toast.error("Course, GitHub link, and description are required.")
      return
    }

    try {
      setSubmitting(true)

      let zipFileUrl: string | undefined

      if (zipFile) {
        const uploadRes = await apiClient.get(
          `/api/projects/upload-url?filename=${encodeURIComponent(zipFile.name)}`,
        )
        const { uploadUrl, key } = uploadRes.data as { uploadUrl: string; key: string }

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: zipFile,
          headers: {
            "Content-Type": zipFile.type || "application/zip",
          },
        })

        if (!uploadResponse.ok) {
          throw new Error("Unable to upload ZIP file.")
        }

        zipFileUrl = key
      }

      await apiClient.post("/api/projects", {
        courseId: Number(selectedCourseId),
        githubLink,
        description,
        zipFile: zipFileUrl,
      })

      toast.success("Project submitted for review")
      setGithubLink("")
      setDescription("")
      setZipFile(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Unable to submit project.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#070312] pt-14">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Project Submission</h1>
          <p className="text-sm text-gray-400">
            Submit a course project using the live backend project APIs.
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-[#0e0820] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-purple-300">
            <BookOpen size={16} />
            Select Course
          </div>
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
          {selectedCourse && (
            <p className="mt-3 text-xs text-gray-400">
              Selected: {selectedCourse.title}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-[#0e0820] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
            <Github size={16} />
            GitHub Repository
          </div>
          <input
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            placeholder="https://github.com/username/repo-name"
            className="input-ui"
          />
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-[#0e0820] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
            <UploadCloud size={16} />
            Upload ZIP File
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-purple-500/20 py-8 text-center text-sm text-gray-400 hover:border-purple-400"
          >
            {zipFile ? zipFile.name : "Drop ZIP file or click to browse"}
          </button>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-[#0e0820] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
            <FileText size={16} />
            Project Description
          </div>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your solution and implementation details."
            className="input-ui min-h-32"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} />
          {submitting ? "Submitting..." : "Submit Project"}
        </button>
      </div>
    </div>
  )
}
