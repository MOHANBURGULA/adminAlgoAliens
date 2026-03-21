"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { apiClient } from "@/lib/axios"
import { AdminCourse } from "@/lib/admin"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadCourses = async () => {
      try {
        const response = await apiClient.get("/api/admin/courses")

        if (!cancelled) {
          setCourses(response.data as AdminCourse[])
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.response?.data?.message || "Unable to load admin courses.")
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

  if (loading) {
    return <div className="text-gray-300">Loading courses...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Courses</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage platform courses using the existing admin APIs.
          </p>
        </div>

        <Link
          href="/admin/courses/create"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Create Course
        </Link>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{course.title}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Difficulty: {course.difficulty}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <span className="rounded-full bg-[#12092A] px-3 py-2">
                  Modules: {course.moduleCount ?? 0}
                </span>
                <span className="rounded-full bg-[#12092A] px-3 py-2">
                  Enrollments: {course.enrollmentCount ?? 0}
                </span>
                <span className="rounded-full bg-[#12092A] px-3 py-2">
                  Certificates: {course.certificateCount ?? 0}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/admin/courses/${course.id}/modules`}
                className="rounded-lg border border-purple-700/40 px-4 py-2 text-sm text-white hover:bg-purple-500/10"
              >
                Manage Modules
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
