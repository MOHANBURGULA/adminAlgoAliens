"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"

export default function AdminCreateCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState("beginner")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSubmitting(true)

      await apiClient.post("/api/admin/courses", {
        title,
        difficulty,
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
    <div className="mx-auto max-w-2xl rounded-2xl border border-purple-900/30 bg-[#0B0518] p-8">
      <h1 className="text-3xl font-semibold text-white">Create Course</h1>
      <p className="mt-2 text-sm text-gray-400">
        Create a course using the existing admin course API.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Course title"
          className="input-ui"
          required
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="input-ui"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

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
