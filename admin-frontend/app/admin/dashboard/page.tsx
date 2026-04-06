"use client"

import { useEffect, useState } from "react"
import { Activity, BookOpen, GraduationCap, ShieldCheck, Video } from "lucide-react"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

type AdminDashboard = {
  totalStudents: number
  totalEnrollments: number
  totalCertificates: number
  pendingProjects: number
  pendingVideos: number
  totalCourses: number
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        const response = await apiClient.get("/api/admin/dashboard")

        if (!cancelled) {
          setData(response.data as AdminDashboard)
          setError("")
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Unable to load admin dashboard."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()
    const interval = window.setInterval(() => {
      void loadDashboard()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  if (loading) {
    return <div className="text-gray-300">Loading admin dashboard...</div>
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error || "Admin dashboard data is unavailable."}
      </div>
    )
  }

  const cards = [
    { label: "Students", value: data.totalStudents, icon: GraduationCap },
    { label: "Courses", value: data.totalCourses, icon: BookOpen },
    { label: "Enrollments", value: data.totalEnrollments, icon: Activity },
    { label: "Certificates", value: data.totalCertificates, icon: ShieldCheck },
  ]

  const pendingItems = [
    { label: "Pending projects", value: data.pendingProjects, icon: Activity },
    { label: "Pending videos", value: data.pendingVideos, icon: Video },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-400">
          Live platform metrics. This screen refreshes automatically every 30 seconds.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
            >
              <Icon className="text-purple-300" size={22} />
              <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-sm text-gray-400">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {pendingItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200">
                  Pending
                </span>
              </div>
              <Icon className="mt-4 text-purple-300" size={18} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
