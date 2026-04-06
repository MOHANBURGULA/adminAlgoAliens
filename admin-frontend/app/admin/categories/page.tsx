"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Tag, Trash2, Pencil, Plus, X, Check } from "lucide-react"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import type { AdminCategoryRecord } from "@/lib/admin-panel"

// Change #11 — New CategoryCRUD page at /admin/categories
// Backed by:
//   GET    /api/admin/categories
//   POST   /api/admin/categories
//   PUT    /api/admin/categories/:id
//   DELETE /api/admin/categories/:id

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Create form state
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCategories = async () => {
    try {
      const res = await apiClient.get("/api/admin/categories")
      setCategories(Array.isArray(res.data) ? (res.data as AdminCategoryRecord[]) : [])
      setError("")
    } catch (err: unknown) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  const createCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newName.trim()) {
      toast.error("Category name is required.")
      return
    }
    try {
      setCreating(true)
      await apiClient.post("/api/admin/categories", {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      })
      setNewName("")
      setNewDescription("")
      await loadCategories()
      toast.success("Category created")
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (cat: AdminCategoryRecord) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDescription(cat.description ?? "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Category name is required.")
      return
    }
    try {
      setSavingId(id)
      await apiClient.put(`/api/admin/categories/${id}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      })
      cancelEdit()
      await loadCategories()
      toast.success("Category updated")
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Courses linked to it will lose their category.`)) {
      return
    }
    try {
      setDeletingId(id)
      await apiClient.delete(`/api/admin/categories/${id}`)
      await loadCategories()
      toast.success("Category deleted")
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-indigo-200/80">
          Admin category management
        </p>
        <h1 className="mt-3 text-3xl text-white">Course Categories</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          Create and manage categories used to organise courses. Categories are displayed in analytics
          and can be assigned when creating or editing a course.
        </p>
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">New Category</h2>
        <form onSubmit={createCategory} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name *"
              className="input-ui flex-1"
              required
              disabled={creating}
            />
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short description (optional)"
              className="input-ui flex-[2]"
              disabled={creating}
            />
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* Category list */}
      <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518]">
        {loading ? (
          <div className="p-6 text-gray-400">Loading categories...</div>
        ) : error ? (
          <div className="p-6 text-red-300">{error}</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-gray-400">
            No categories yet. Create the first one above.
          </div>
        ) : (
          <ul className="divide-y divide-purple-900/20">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id
              const isSaving = savingId === cat.id
              const isDeleting = deletingId === cat.id

              return (
                <li key={cat.id} className="p-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-ui flex-1"
                          disabled={isSaving}
                          autoFocus
                        />
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="input-ui flex-[2]"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(cat.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-60"
                        >
                          <Check size={13} />
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Tag size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                        <div>
                          <p className="font-medium text-white">{cat.name}</p>
                          {cat.description && (
                            <p className="mt-0.5 text-sm text-gray-400">{cat.description}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-600 font-mono">{cat.id}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCategory(cat.id, cat.name)}
                          disabled={isDeleting}
                          className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
