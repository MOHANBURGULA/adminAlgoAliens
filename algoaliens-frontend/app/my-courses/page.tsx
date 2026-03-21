"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BookOpen } from "lucide-react"
import { apiClient } from "@/lib/axios"

type Enrollment = {
  id: number
  courseId: number
  progress: number
  createdAt: string
}

type Course = {
  id: number
  title: string
  difficulty: string
}

type EnrolledCourse = Enrollment & {
  course: Course | null
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadEnrollments = async () => {
      try {
        setLoading(true)
        setError("")

        const enrollmentsRes = await apiClient.get("/api/enroll")
        const enrollments = enrollmentsRes.data as Enrollment[]

        const courseResults = await Promise.allSettled(
          enrollments.map((enrollment) =>
            apiClient.get(`/api/courses/${enrollment.courseId}`),
          ),
        )

        const combined = enrollments
          .map((enrollment, index) => ({
            ...enrollment,
            course:
              courseResults[index]?.status === "fulfilled"
                ? (courseResults[index].value.data as Course)
                : null,
          }))
          .sort((a, b) => b.progress - a.progress)

        if (!cancelled) {
          setCourses(combined)
        }
      } catch (loadError: any) {
        if (!cancelled) {
          if (loadError?.response?.status === 404) {
            setCourses([])
            return
          }

          setError(
            loadError?.response?.data?.message || "Unable to load your courses.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadEnrollments()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading your courses...
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

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0B0518] p-8 text-center text-gray-400">
        You have not enrolled in any courses yet.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <BookOpen className="text-purple-400" size={24} />
          My Courses
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Track progress across your live enrollments.
        </p>
      </div>

      <div className="grid gap-5">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {course.course?.title || `Course #${course.courseId}`}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Difficulty: {course.course?.difficulty || "unknown"}
                </p>
              </div>

              <Link
                href={`/courses/${course.courseId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white"
              >
                Continue
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>

              <div className="mt-3 h-3 rounded-full bg-[#1B1238]">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
