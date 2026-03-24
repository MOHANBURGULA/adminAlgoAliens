"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, GraduationCap, Layers3, Plus } from "lucide-react"
import toast from "react-hot-toast"
import CourseCard from "@/components/admin/cards/CourseCard"
import { CourseEditorModal } from "@/components/admin/modals/CourseEditorModal"
import FilterBar from "@/components/admin/ui/FilterBar"
import ConfirmModal from "@/components/admin/ui/ConfirmModal"
import StatsCard from "@/components/admin/ui/StatsCard"
import { buttonStyles } from "@/components/admin/ui/Button"
import { type AdminCourseRecord } from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced"

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<AdminCourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [editingCourse, setEditingCourse] = useState<AdminCourseRecord | null>(null)
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<AdminCourseRecord | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null)
  const [savingCourseId, setSavingCourseId] = useState<number | null>(null)
  const debouncedSearch = useDebouncedValue(search, 250)

  const loadCourses = async () => {
    try {
      const response = await apiClient.get("/api/admin/courses")
      setCourses(Array.isArray(response.data) ? (response.data as AdminCourseRecord[]) : [])
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Unable to load admin courses."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesQuery =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.difficulty.toLowerCase().includes(query)
      const matchesDifficulty =
        difficultyFilter === "all" || course.difficulty.trim().toLowerCase() === difficultyFilter

      return matchesQuery && matchesDifficulty
    })
  }, [courses, debouncedSearch, difficultyFilter])

  const totals = useMemo(
    () => ({
      courses: courses.length,
      modules: courses.reduce((sum, course) => sum + (course.moduleCount ?? 0), 0),
      enrollments: courses.reduce((sum, course) => sum + (course.enrollmentCount ?? 0), 0),
      certificates: courses.reduce((sum, course) => sum + (course.certificateCount ?? 0), 0),
    }),
    [courses],
  )

  const saveCourse = async (payload: { title: string; difficulty: string }) => {
    if (!editingCourse) {
      return
    }

    const nextTitle = payload.title.trim()
    const nextDifficulty = payload.difficulty.trim().toLowerCase()

    if (!nextTitle) {
      toast.error("Course title is required")
      return
    }

    if (!nextDifficulty) {
      toast.error("Difficulty is required")
      return
    }

    try {
      setSavingCourseId(editingCourse.id)
      await apiClient.put(`/api/admin/courses/${editingCourse.id}`, {
        title: nextTitle,
        difficulty: nextDifficulty,
      })
      toast.success("Course updated")
      setEditingCourse(null)
      await loadCourses()
    } catch (updateError: unknown) {
      toast.error(getApiErrorMessage(updateError, "Unable to update course."))
    } finally {
      setSavingCourseId(null)
    }
  }

  const confirmDeleteCourse = async () => {
    if (!pendingDeleteCourse) {
      return
    }

    setDeletingCourseId(pendingDeleteCourse.id)

    try {
      await apiClient.delete(`/api/admin/courses/${pendingDeleteCourse.id}`)
      toast.success("Course deleted successfully")
      setPendingDeleteCourse(null)
      await loadCourses()
    } catch (deleteError: unknown) {
      toast.error(getApiErrorMessage(deleteError, "Unable to delete course."))
    } finally {
      setDeletingCourseId(null)
    }
  }

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
    <>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-indigo-200/80">
              Admin course inventory
            </p>
            <h1 className="mt-3 text-3xl text-white">Courses</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Manage the live catalog with production-safe editing controls, cleaner hierarchy,
              and responsive cards that stay readable even on smaller screens.
            </p>
          </div>

          <Link
            href="/admin/courses/create"
            className={buttonStyles({ variant: "primary", className: "w-full sm:w-auto" })}
          >
            <Plus size={16} />
            Create Course
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Courses" value={totals.courses} icon={BookOpen} />
          <StatsCard label="Modules" value={totals.modules} icon={Layers3} />
          <StatsCard label="Enrollments" value={totals.enrollments} icon={GraduationCap} />
          <StatsCard label="Certificates" value={totals.certificates} icon={BookOpen} />
        </section>

        <FilterBar summary={`${filteredCourses.length} of ${courses.length} courses shown`}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses"
            className="input-ui min-w-full sm:min-w-64 lg:max-w-xs"
          />
          <select
            value={difficultyFilter}
            onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
            className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
          >
            <option value="all">All difficulty levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </FilterBar>

        {filteredCourses.length === 0 ? (
          <div className="surface-panel p-6 text-slate-300">
            No courses match the current filters.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                deleting={deletingCourseId === course.id}
                onEdit={setEditingCourse}
                onDelete={setPendingDeleteCourse}
              />
            ))}
          </section>
        )}
      </div>

      <CourseEditorModal
        course={editingCourse}
        loading={savingCourseId !== null}
        open={editingCourse !== null}
        onClose={() => {
          if (savingCourseId === null) {
            setEditingCourse(null)
          }
        }}
        onSubmit={(payload) => void saveCourse(payload)}
      />

      <ConfirmModal
        open={pendingDeleteCourse !== null}
        title="Delete course"
        description={
          pendingDeleteCourse
            ? `Delete "${pendingDeleteCourse.title}"? This removes the course and its admin-managed content. Courses with enrollments cannot be deleted.`
            : ""
        }
        confirmLabel="Delete Course"
        loading={deletingCourseId !== null}
        onConfirm={() => void confirmDeleteCourse()}
        onClose={() => {
          if (deletingCourseId === null) {
            setPendingDeleteCourse(null)
          }
        }}
      />
    </>
  )
}
