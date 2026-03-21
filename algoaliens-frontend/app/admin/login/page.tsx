"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { storeAdminSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSubmitting(true)

      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      })

      const token = response.data.token
      const user = response.data.user

      if (!token || !user || user.role !== "admin") {
        throw new Error("Admin access only")
      }

      storeAdminSession(token, user)
      router.replace("/admin/dashboard")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Admin login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070312] px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-purple-900/30 bg-[#0B0518] p-8"
      >
        <h1 className="text-3xl font-semibold text-purple-300">Admin Login</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in with an existing backend admin account.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            className="input-ui"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-ui"
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in as admin"}
          </button>
        </div>
      </form>
    </div>
  )
}
