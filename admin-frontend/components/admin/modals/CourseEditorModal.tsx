"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { AdminCategoryRecord, AdminCourseRecord } from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

type CourseEditorModalProps = {
  course: AdminCourseRecord | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: {
    title: string
    description?: string
    keywords?: string[]
    categoryId?: string
  }) => void
  open: boolean
}

type CourseEditorFormProps = {
  course: AdminCourseRecord
  categories: AdminCategoryRecord[]
  loading?: boolean
  onClose: () => void
  onCreateCategory: (payload: {
    name: string
    description?: string
  }) => Promise<AdminCategoryRecord | null>
  onSubmit: (payload: {
    title: string
    description?: string
    keywords?: string[]
    categoryId?: string
  }) => void
}

function CourseEditorForm({
  course,
  categories,
  loading = false,
  onClose,
  onCreateCategory,
  onSubmit,
}: CourseEditorFormProps) {
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? "")
  const [keywords, setKeywords] = useState((course.keywords ?? []).join(", "))
  const [categoryId, setCategoryId] = useState(course.categoryId ?? "")
  const [showCategoryCreator, setShowCategoryCreator] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)

  const handleSubmit = () => {
    const keywordsArray = keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    onSubmit({
      title,
      description: description || undefined,
      keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
      categoryId: categoryId || undefined,
    })
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()

    if (!name) {
      toast.error("Category name is required.")
      return
    }

    try {
      setSavingCategory(true)
      const createdCategory = await onCreateCategory({
        name,
        description: newCategoryDescription.trim() || undefined,
      })

      if (createdCategory) {
        setCategoryId(createdCategory.id)
        setNewCategoryName("")
        setNewCategoryDescription("")
        setShowCategoryCreator(false)
        toast.success("Category created and selected")
      }
    } finally {
      setSavingCategory(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Course title</label>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Course title"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Brief description of the course"
          className="input-ui min-h-24 resize-none"
          rows={4}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Keywords <span className="font-normal text-slate-500">(comma-separated)</span>
        </label>
        <Input
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder="e.g. arrays, sorting, graphs"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="mb-2 block text-sm font-medium text-slate-200">Category</label>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-teal-400/20 bg-[#05070d] px-4 text-sm text-white shadow-[0_0_0_1px_rgba(45,212,191,0.05)] outline-none transition hover:border-teal-300/40 focus:border-teal-300"
        >
          <option value="">No category selected</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-slate-400">
            If this course belongs to a new track, create the category here and assign it
            immediately.
          </p>
          <button
            type="button"
            onClick={() => setShowCategoryCreator((current) => !current)}
            className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
          >
            {showCategoryCreator ? "Hide creator" : "Create category"}
          </button>
        </div>

        {showCategoryCreator ? (
          <div className="mt-4 space-y-3">
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Category name, e.g. Databases"
            />
            <textarea
              value={newCategoryDescription}
              onChange={(event) => setNewCategoryDescription(event.target.value)}
              placeholder="Optional description for the new category"
              className="input-ui min-h-20 resize-none"
              rows={3}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                onClick={() => void handleCreateCategory()}
                disabled={savingCategory}
              >
                {savingCategory ? "Creating..." : "Create and select"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCategoryCreator(false)
                  setNewCategoryName("")
                  setNewCategoryDescription("")
                }}
                disabled={savingCategory}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

export function CourseEditorModal({
  course,
  loading = false,
  onClose,
  onSubmit,
  open,
}: CourseEditorModalProps) {
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([])

  const loadCategories = async () => {
    try {
      const response = await apiClient.get("/api/admin/categories")
      setCategories(Array.isArray(response.data) ? (response.data as AdminCategoryRecord[]) : [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    void loadCategories()
  }, [open])

  const createCategory = async (payload: {
    name: string
    description?: string
  }) => {
    try {
      const response = await apiClient.post("/api/admin/categories", payload)
      const createdCategory = response.data as AdminCategoryRecord
      await loadCategories()
      return createdCategory
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error))
      return null
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) {
          onClose()
        }
      }}
      title="Edit Course"
      description="Update the course details, assign it to a category, or create a new category from this modal."
      footer={null}
    >
      {course ? (
        <CourseEditorForm
          key={course.id}
          course={course}
          categories={categories}
          loading={loading}
          onClose={onClose}
          onCreateCategory={createCategory}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  )
}
