"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, GraduationCap, Layers3, Plus, Tag } from "lucide-react"
import toast from "react-hot-toast"
import CourseCard from "@/components/admin/cards/CourseCard"
import { CourseEditorModal } from "@/components/admin/modals/CourseEditorModal"
import CategorySelect from "@/components/admin/ui/CategorySelect"
import FilterBar from "@/components/admin/ui/FilterBar"
import ConfirmModal from "@/components/admin/ui/ConfirmModal"
import StatsCard from "@/components/admin/ui/StatsCard"
import { buttonStyles } from "@/components/admin/ui/Button"
import { type AdminCategoryRecord, type AdminCourseRecord } from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<AdminCourseRecord[]>([])
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("all")
  const [editingCourse, setEditingCourse] = useState<AdminCourseRecord | null>(null)
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<AdminCourseRecord | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null)
  const [savingCourseId, setSavingCourseId] = useState<number | null>(null)
  const debouncedSearch = useDebouncedValue(search, 250)

  const loadData = async () => {
    try {
      const [coursesResponse, categoriesResponse] = await Promise.all([
        apiClient.get("/api/admin/courses"),
        apiClient.get("/api/admin/categories"),
      ])

      setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseRecord[]) : [])
      setCategories(
        Array.isArray(categoriesResponse.data)
          ? (categoriesResponse.data as AdminCategoryRecord[])
          : [],
      )
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const coursesWithCategoryNames = useMemo(
    () =>
      courses.map((course) => ({
        ...course,
        categoryName: course.categoryName ?? (course.categoryId ? categoryMap.get(course.categoryId) ?? null : null),
      })),
    [categoryMap, courses],
  )

  const filteredCourses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return coursesWithCategoryNames.filter((course) => {
      const categoryName = course.categoryName?.toLowerCase() ?? ""
      const keywordsMatch =
        query && course.keywords
          ? course.keywords.some((keyword) => keyword.toLowerCase().includes(query))
          : false

      const matchesQuery =
        !query ||
        course.title.toLowerCase().includes(query) ||
        (course.description?.toLowerCase().includes(query) ?? false) ||
        categoryName.includes(query) ||
        keywordsMatch

      const matchesCategory =
        selectedCategoryId === "all" || course.categoryId === selectedCategoryId

      return matchesQuery && matchesCategory
    })
  }, [coursesWithCategoryNames, debouncedSearch, selectedCategoryId])

  const totals = useMemo(
    () => ({
      courses: courses.length,
      categories: categories.length,
      modules: courses.reduce((sum, course) => sum + (course.moduleCount ?? 0), 0),
      enrollments: courses.reduce((sum, course) => sum + (course.enrollmentCount ?? 0), 0),
    }),
    [categories.length, courses],
  )

  const saveCourse = async (payload: {
    title: string
    description?: string
    keywords?: string[]
    categoryId?: string
  }) => {
    if (!editingCourse) {
      return
    }

    const nextTitle = payload.title.trim()

    if (!nextTitle) {
      toast.error("Course title is required")
      return
    }

    try {
      setSavingCourseId(editingCourse.id)
      await apiClient.put(`/api/admin/courses/${editingCourse.id}`, {
        title: nextTitle,
        description: payload.description,
        keywords: payload.keywords,
        categoryId: payload.categoryId,
      })
      toast.success("Course updated")
      setEditingCourse(null)
      await loadData()
    } catch (updateError: unknown) {
      toast.error(getApiErrorMessage(updateError))
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
      await loadData()
    } catch (deleteError: unknown) {
      toast.error(getApiErrorMessage(deleteError))
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
              Manage the course catalog by category, keep related courses grouped together, and
              jump into module management without losing the category context.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/categories"
              className={buttonStyles({ variant: "outline", className: "w-full sm:w-auto" })}
            >
              Manage Categories
            </Link>
            <Link
              href="/admin/courses/create"
              className={buttonStyles({ variant: "primary", className: "w-full sm:w-auto" })}
            >
              <Plus size={16} />
              Create Course
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Courses" value={totals.courses} icon={BookOpen} />
          <StatsCard label="Categories" value={totals.categories} icon={Tag} />
          <StatsCard label="Modules" value={totals.modules} icon={Layers3} />
          <StatsCard label="Enrollments" value={totals.enrollments} icon={GraduationCap} />
        </section>

        <FilterBar summary={`${filteredCourses.length} of ${courses.length} courses shown`}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, keywords, category..."
            className="input-ui min-w-full sm:min-w-64 lg:max-w-xs"
          />

          <div className="min-w-full sm:min-w-60 lg:max-w-xs">
            <CategorySelect
              categories={categories}
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
            />
          </div>
        </FilterBar>

        {filteredCourses.length === 0 ? (
          <div className="surface-panel p-6 text-slate-300">
            No courses match the current search and category filter.
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
