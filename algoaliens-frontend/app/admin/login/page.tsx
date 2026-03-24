"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { clearAllSessions, clearAuthSession, storeAuthSession } from "@/lib/auth"
import { apiClient, getLastApiErrorMessage } from "@/lib/api-client"
import { getApiErrorMessage } from "@/lib/http"

type AuthResponse = {
  token?: string
  user?: {
    id: number
    name: string
    email: string
    role?: string
  }
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setSubmitting(true)

    try {
      clearAllSessions()

      const data = await apiClient.post<AuthResponse>("/api/auth/login", {
        email: email.trim(),
        password,
      })

      if (!data) {
        throw new Error(getLastApiErrorMessage() || "Unable to sign in")
      }

      const token = data.token

      console.debug("[auth] admin login response", {
        hasToken: Boolean(token),
        userId: data.user?.id,
        role: data.user?.role || "student",
      })

      if (!token || !data.user) {
        throw new Error("Invalid authentication response")
      }

      if (data.user.role !== "admin") {
        throw new Error("Access denied")
      }

      storeAuthSession(token, data.user)
      toast.success("Admin login successful")
      router.replace("/admin/dashboard")
    } catch (error: unknown) {
      clearAuthSession()
      const message = getApiErrorMessage(error, "Unable to sign in")
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070312] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-purple-900/30 bg-[#0B0518] p-8"
      >
        <h1 className="text-3xl font-semibold text-white">Admin Login</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in with an administrator account to access the control panel.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email"
            className="input-ui"
            disabled={submitting}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="input-ui"
            disabled={submitting}
            required
          />
        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-300">{errorMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Open admin panel"}
        </button>

        <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
          <Link href="/" className="hover:text-white">
            Back home
          </Link>
          <Link href="/signin" className="hover:text-white">
            Student sign in
          </Link>
        </div>
      </form>
    </div>
  )
}
