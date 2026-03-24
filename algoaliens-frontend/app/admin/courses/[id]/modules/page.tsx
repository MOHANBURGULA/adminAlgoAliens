"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  GripVertical,
  Layers3,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"
import { ModuleEditorModal } from "@/components/admin/modals/ModuleEditorModal"
import ConfirmModal from "@/components/admin/ui/ConfirmModal"
import Badge from "@/components/admin/ui/Badge"
import Button, { buttonStyles } from "@/components/admin/ui/Button"
import { apiClient } from "@/lib/axios"
import type { AdminModule } from "@/lib/admin"
import { getDifficultyMeta } from "@/lib/admin-panel"
import { getApiErrorMessage } from "@/lib/http"

type Course = {
  id: number
  title: string
  difficulty: string
}

export default function AdminCourseModulesPage() {
  const params = useParams<{ id: string }>()
  const courseId = Number(params?.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<AdminModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create")
  const [editingModule, setEditingModule] = useState<AdminModule | null>(null)
  const [savingModule, setSavingModule] = useState(false)
  const [pendingDeleteModule, setPendingDeleteModule] = useState<AdminModule | null>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null)

  const suggestedOrderIndex = useMemo(() => modules.length + 1, [modules.length])
  const difficultyMeta = course ? getDifficultyMeta(course.difficulty) : null

  const loadData = useCallback(async () => {
    const [courseRes, modulesRes] = await Promise.all([
      apiClient.get(`/api/courses/${courseId}`),
      apiClient.get(`/api/courses/${courseId}/modules`),
    ])

    setCourse(courseRes.data as Course)
    setModules(modulesRes.data as AdminModule[])
    setError("")
  }, [courseId])

  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) {
      setError("Invalid course route.")
      setLoading(false)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        await loadData()
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Unable to load modules."))
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
  }, [courseId, loadData])

  const openCreateModal = () => {
    setEditorMode("create")
    setEditingModule(null)
    setEditorOpen(true)
  }

  const openEditModal = (moduleItem: AdminModule) => {
    setEditorMode("edit")
    setEditingModule(moduleItem)
    setEditorOpen(true)
  }

  const saveModule = async (payload: { orderIndex: number; title: string }) => {
    const title = payload.title.trim()
    const orderIndex = Number(payload.orderIndex)

    if (!title) {
      toast.error("Module title is required")
      return
    }

    if (!Number.isFinite(orderIndex) || orderIndex < 1) {
      toast.error("Order index must be 1 or greater")
      return
    }

    try {
      setSavingModule(true)

      if (editorMode === "create") {
        await apiClient.post("/api/admin/modules", {
          courseId,
          title,
          orderIndex,
        })
        toast.success("Module created")
      } else if (editingModule) {
        await apiClient.put(`/api/admin/modules/${editingModule.id}`, {
          title,
          orderIndex,
        })
        toast.success("Module updated")
      }

      setEditorOpen(false)
      setEditingModule(null)
      await loadData()
    } catch (saveError: unknown) {
      toast.error(getApiErrorMessage(saveError, "Unable to save module."))
    } finally {
      setSavingModule(false)
    }
  }

  const deleteModule = async () => {
    if (!pendingDeleteModule) {
      return
    }

    try {
      setDeletingModuleId(pendingDeleteModule.id)
      await apiClient.delete(`/api/admin/modules/${pendingDeleteModule.id}`)
      toast.success("Module deleted")
      setPendingDeleteModule(null)
      await loadData()
    } catch (deleteError: unknown) {
      toast.error(getApiErrorMessage(deleteError, "Unable to delete module."))
    } finally {
      setDeletingModuleId(null)
    }
  }

  if (loading) {
    return <div className="surface-panel p-6 text-slate-300">Loading modules...</div>
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to courses
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="slate">Course structure</Badge>
              {difficultyMeta ? <Badge tone={difficultyMeta.tone}>{difficultyMeta.label}</Badge> : null}
            </div>

            <div>
              <h1 className="text-3xl font-semibold text-white">
                {course?.title || `Course #${courseId}`} Modules
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Keep the learning flow tidy with ordered module cards, clean content entry points,
                and in-app edit/delete controls instead of browser prompts.
              </p>
            </div>
          </div>

          <Button variant="primary" className="w-full sm:w-auto" onClick={openCreateModal}>
            <Plus size={16} />
            Add Module
          </Button>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="surface-panel p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Total modules</p>
            <p className="mt-4 text-3xl font-semibold text-white">{modules.length}</p>
          </div>
          <div className="surface-panel p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Next order slot</p>
            <p className="mt-4 text-3xl font-semibold text-white">{suggestedOrderIndex}</p>
          </div>
          <div className="surface-panel p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Course id</p>
            <p className="mt-4 text-3xl font-semibold text-white">{courseId}</p>
          </div>
        </section>

        {modules.length === 0 ? (
          <div className="surface-panel p-8 text-slate-300">
            No modules yet. Create the first module to start wiring course content.
          </div>
        ) : (
          <section className="space-y-4">
            {modules.map((moduleItem) => (
              <article key={moduleItem.id} className="surface-card p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-[#0F172A] text-indigo-100">
                      <div className="flex items-center gap-1">
                        <GripVertical size={15} />
                        <span className="text-base font-semibold">{moduleItem.orderIndex}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Module order {moduleItem.orderIndex}
                      </p>
                      <h2 className="mt-2 line-clamp-2 break-words text-xl font-semibold text-white">
                        {moduleItem.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        Manage theory, activity, and explanation resources from the content page.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                    <Link
                      href={`/admin/modules/${moduleItem.id}/content?courseId=${courseId}`}
                      className={buttonStyles({ variant: "outline", className: "w-full sm:w-auto" })}
                    >
                      <Layers3 size={16} />
                      Manage Content
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full sm:w-auto"
                      onClick={() => openEditModal(moduleItem)}
                    >
                      <PencilLine size={16} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="w-full sm:w-auto"
                      disabled={deletingModuleId === moduleItem.id}
                      onClick={() => setPendingDeleteModule(moduleItem)}
                    >
                      <Trash2 size={16} />
                      {deletingModuleId === moduleItem.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <ModuleEditorModal
        open={editorOpen}
        mode={editorMode}
        moduleItem={editingModule}
        suggestedOrderIndex={suggestedOrderIndex}
        loading={savingModule}
        onClose={() => {
          if (!savingModule) {
            setEditorOpen(false)
            setEditingModule(null)
          }
        }}
        onSubmit={(payload) => void saveModule(payload)}
      />

      <ConfirmModal
        open={pendingDeleteModule !== null}
        title="Delete module"
        description={
          pendingDeleteModule
            ? `Delete "${pendingDeleteModule.title}" from this course? Module content and quiz wiring should be reviewed before removal.`
            : ""
        }
        confirmLabel="Delete Module"
        loading={deletingModuleId !== null}
        onConfirm={() => void deleteModule()}
        onClose={() => {
          if (deletingModuleId === null) {
            setPendingDeleteModule(null)
          }
        }}
      />
    </>
  )
}
