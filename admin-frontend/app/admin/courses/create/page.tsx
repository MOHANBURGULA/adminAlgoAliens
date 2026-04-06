"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"
import type { AdminCategoryRecord } from "@/lib/admin-panel"

export default function AdminCreateCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [keywords, setKeywords] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([])
  const [showCategoryCreator, setShowCategoryCreator] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadCategories = async () => {
    try {
      const response = await apiClient.get("/api/admin/categories")
      setCategories(Array.isArray(response.data) ? (response.data as AdminCategoryRecord[]) : [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  const createCategory = async () => {
    const name = newCategoryName.trim()

    if (!name) {
      toast.error("Category name is required.")
      return
    }

    try {
      setSavingCategory(true)
      const response = await apiClient.post("/api/admin/categories", {
        name,
        description: newCategoryDescription.trim() || undefined,
      })

      const createdCategory = response.data as AdminCategoryRecord
      await loadCategories()
      setCategoryId(createdCategory.id)
      setNewCategoryName("")
      setNewCategoryDescription("")
      setShowCategoryCreator(false)
      toast.success("Category created and selected")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create category.")
    } finally {
      setSavingCategory(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const keywordsArray = keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    try {
      setSubmitting(true)

      await apiClient.post("/api/admin/courses", {
        title,
        description: description || undefined,
        keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
        categoryId: categoryId || undefined,
      })

      toast.success("Course created")
      router.replace("/admin/courses")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create course.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-purple-900/30 bg-[#0B0518] p-8">
      <h1 className="text-3xl font-semibold text-white">Create Course</h1>
      <p className="mt-2 text-sm text-gray-400">
        Fill in the course details, pick an existing category, or create a new category without leaving this screen.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Course title *</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Data Structures & Algorithms"
            className="input-ui"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly describe what students will learn in this course"
            className="input-ui min-h-24 resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Keywords <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="e.g. arrays, sorting, graphs"
            className="input-ui"
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">Course category</p>
            <p className="mt-1 text-xs text-gray-400">
              Choose an existing category such as Competitive Programming, SQL, or create a new
              one below if this course needs a new grouping.
            </p>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="mt-4 h-12 w-full appearance-none rounded-2xl border border-teal-400/20 bg-[#05070d] px-4 text-sm text-white shadow-[0_0_0_1px_rgba(45,212,191,0.05)] outline-none transition hover:border-teal-300/40 focus:border-teal-300"
            >
              <option value="">No category selected</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Need a new course category?</p>
                <p className="mt-1 text-xs text-gray-400">
                  Create it here and this course can be assigned to it immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryCreator((current) => !current)}
                className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
              >
                {showCategoryCreator ? "Hide category creator" : "Create category here"}
              </button>
            </div>

            {showCategoryCreator ? (
              <div className="mt-4 space-y-4">
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Category name, e.g. Competitive Programming"
                  className="input-ui"
                />
                <textarea
                  value={newCategoryDescription}
                  onChange={(event) => setNewCategoryDescription(event.target.value)}
                  placeholder="Optional description for the new category"
                  className="input-ui min-h-24 resize-none"
                  rows={3}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void createCategory()}
                    disabled={savingCategory}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {savingCategory ? "Creating category..." : "Create and select category"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryCreator(false)
                      setNewCategoryName("")
                      setNewCategoryDescription("")
                    }}
                    className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.05] sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Course"}
        </button>
      </form>
    </div>
  )
}
