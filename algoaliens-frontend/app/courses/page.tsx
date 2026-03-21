"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { BookOpen, CalendarDays, Search, Sparkles } from "lucide-react"
import { apiClient } from "@/lib/axios"

type Course = {
  id: number
  title: string
  difficulty: string
  createdAt: string
}

type Enrollment = {
  id: number
  courseId: number
  progress: number
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDifficulty(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollmentIds, setEnrollmentIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadCourses = async () => {
      try {
        setLoading(true)
        setError("")

        const [coursesRes, enrollmentsRes] = await Promise.all([
          apiClient.get("/api/courses"),
          apiClient.get("/api/enroll"),
        ])

        if (cancelled) {
          return
        }

        const enrollments = enrollmentsRes.data as Enrollment[]
        setCourses(coursesRes.data as Course[])
        setEnrollmentIds(new Set(enrollments.map((enrollment) => enrollment.courseId)))
      } catch (loadError: any) {
        if (!cancelled) {
          if (loadError?.response?.status === 404) {
            setCourses([])
            setEnrollmentIds(new Set())
            return
          }

          setError(
            loadError?.response?.data?.message || "Unable to load courses.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return courses.filter((course) =>
      course.title.toLowerCase().includes(normalizedSearch),
    )
  }, [courses, search])

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId)
      await apiClient.post("/api/enroll", { courseId })

      toast.success("Enrollment successful")
      router.push(`/courses/${courseId}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to enroll right now.")
    } finally {
      setEnrollingCourseId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading courses...
      </div>
    )
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BookOpen className="text-purple-400" size={24} />
            Courses
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Browse live course data from the backend and enroll directly.
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input-ui w-full pl-10"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0B0518] p-8 text-center text-gray-400">
          No courses matched your search.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const isEnrolled = enrollmentIds.has(course.id)
            const isSubmitting = enrollingCourseId === course.id

            return (
              <div
                key={course.id}
                className="card-ui flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs text-purple-200">
                      {formatDifficulty(course.difficulty)}
                    </span>
                    {isEnrolled && (
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">
                        Enrolled
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-white">
                    {course.title}
                  </h2>

                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-300" />
                      Course ID: {course.id}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-cyan-300" />
                      Created {formatDate(course.createdAt)}
                    </div>
                  </div>
                </div>

                {isEnrolled ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/courses/${course.id}`)}
                    className="btn-primary w-full"
                  >
                    Open course
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleEnroll(course.id)}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-purple-700 py-3 font-medium text-white transition hover:border-purple-500 hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Enrolling..." : "Enroll now"}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
