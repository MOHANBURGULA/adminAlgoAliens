"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"
import { AdminModule } from "@/lib/admin"

type Course = {
  id: number
  title: string
  difficulty: string
}

export default function AdminCourseModulesPage() {
  const params = useParams<{ id: string }>()
  const courseId = Number(params.id)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<AdminModule[]>([])
  const [title, setTitle] = useState("")
  const [orderIndex, setOrderIndex] = useState(1)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [courseRes, modulesRes] = await Promise.all([
      apiClient.get(`/api/courses/${courseId}`),
      apiClient.get(`/api/courses/${courseId}/modules`),
    ])

    setCourse(courseRes.data as Course)
    setModules(modulesRes.data as AdminModule[])
    setOrderIndex((modulesRes.data as AdminModule[]).length + 1)
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await loadData()
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.response?.data?.message || "Unable to load modules.")
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
  }, [courseId])

  const addModule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await apiClient.post("/api/admin/modules", {
        courseId,
        title,
        orderIndex,
      })

      setTitle("")
      await loadData()
      toast.success("Module created")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create module.")
    }
  }

  const updateModule = async (module: AdminModule) => {
    const nextTitle = window.prompt("Module title", module.title)

    if (!nextTitle) {
      return
    }

    try {
      await apiClient.put(`/api/admin/modules/${module.id}`, {
        title: nextTitle,
        orderIndex: module.orderIndex,
      })

      await loadData()
      toast.success("Module updated")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update module.")
    }
  }

  const deleteModule = async (moduleId: number) => {
    try {
      await apiClient.delete(`/api/admin/modules/${moduleId}`)
      await loadData()
      toast.success("Module deleted")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to delete module.")
    }
  }

  if (loading) {
    return <div className="text-gray-300">Loading modules...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {course?.title || `Course #${courseId}`} Modules
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Add and maintain module structure for this course.
        </p>
      </div>

      <form
        onSubmit={addModule}
        className="grid gap-4 rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6 md:grid-cols-[1fr_140px_auto]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Module title"
          className="input-ui"
          required
        />

        <input
          type="number"
          min={1}
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value))}
          className="input-ui"
        />

        <button type="submit" className="btn-primary">
          Add Module
        </button>
      </form>

      <div className="space-y-4">
        {modules.map((module) => (
          <div
            key={module.id}
            className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-gray-400">Order {module.orderIndex}</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{module.title}</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/admin/modules/${module.id}/content?courseId=${courseId}`}
                  className="rounded-lg border border-purple-700/40 px-4 py-2 text-sm text-white hover:bg-purple-500/10"
                >
                  Manage Content
                </Link>
                <button
                  type="button"
                  onClick={() => void updateModule(module)}
                  className="rounded-lg border border-cyan-700/40 px-4 py-2 text-sm text-white hover:bg-cyan-500/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteModule(module.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
