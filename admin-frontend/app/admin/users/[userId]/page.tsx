"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"

type Enrollment = { id: number; courseId: number; progress: number; createdAt?: string }
type Certificate = { id: number; courseId: number; score: number; issuedAt?: string }

type UserDetails = {
  id: number
  name: string
  email: string
  role: string
  enrollments: Enrollment[]
  certificates: Certificate[]
}

export default function AdminUserDetailsPage() {
  const params = useParams<{ userId: string }>()
  const userId = params?.userId ?? ""
  const [user, setUser] = useState<UserDetails | null>(null)
  const [tab, setTab] = useState<"enrollments" | "certificates">("enrollments")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) {
      setError("Invalid user route.")
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const response = await apiClient.get(`/api/admin/users/${userId}`)
        setUser(response.data as UserDetails)
        setError("")
      } catch (loadError: unknown) {
        setError(getApiErrorMessage(loadError, "Unable to load user details."))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [userId])

  const tabContent = useMemo(() => {
    if (!user) {
      return null
    }

    if (tab === "enrollments") {
      return user.enrollments.map((entry) => (
        <div key={entry.id} className="rounded-xl bg-[#12092A] p-4 text-sm text-white">
          Course {entry.courseId} - Progress {entry.progress}%
        </div>
      ))
    }

    return user.certificates.map((entry) => (
      <div key={entry.id} className="rounded-xl bg-[#12092A] p-4 text-sm text-white">
        Course {entry.courseId} - Certificate score {entry.score}
      </div>
    ))
  }, [tab, user])

  if (loading) {
    return <div className="text-gray-300">Loading user details...</div>
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error || "User details unavailable."}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">{user.name}</h1>
        <p className="mt-2 text-sm text-gray-400">
          {user.email} - {user.role}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["enrollments", "certificates"] as const).map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setTab(entry)}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === entry ? "bg-purple-500 text-white" : "bg-[#12092A] text-gray-300"
            }`}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="space-y-3">{tabContent}</div>
    </div>
  )
}
