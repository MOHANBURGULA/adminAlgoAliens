"use client"

import { useEffect, useState } from "react"
import { Activity, BookOpen, CreditCard, Users } from "lucide-react"
import { apiClient } from "@/lib/axios"

type AdminDashboard = {
  totalStudents: number
  totalEnrollments: number
  totalCertificates: number
  pendingEvaluations: number
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
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(
            loadError?.response?.data?.message || "Unable to load admin dashboard.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
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
    { label: "Total Users", value: data.totalStudents, icon: Users },
    { label: "Total Courses", value: data.totalCourses, icon: BookOpen },
    { label: "Total Enrollments", value: data.totalEnrollments, icon: Activity },
    { label: "Total Revenue", value: "N/A", icon: CreditCard },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-400">
          Overview of platform usage, pending reviews, and content operations.
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

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6">
          <p className="text-sm text-gray-400">Pending evaluations</p>
          <p className="mt-3 text-2xl font-semibold text-white">{data.pendingEvaluations}</p>
        </div>
        <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6">
          <p className="text-sm text-gray-400">Pending projects</p>
          <p className="mt-3 text-2xl font-semibold text-white">{data.pendingProjects}</p>
        </div>
        <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6">
          <p className="text-sm text-gray-400">Pending videos</p>
          <p className="mt-3 text-2xl font-semibold text-white">{data.pendingVideos}</p>
        </div>
      </div>
    </div>
  )
}
