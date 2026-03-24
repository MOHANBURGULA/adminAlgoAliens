"use client"

import Link from "next/link"
import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { clearAllSessions, clearAuthSession, resolvePostAuthRoute, storeAuthSession } from "@/lib/auth"
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

export default function SigninPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleGoogleSignin = async () => {
    try {
      setGoogleLoading(true)
      clearAllSessions()
      await signOut({ redirect: false })
      await signIn("google", {
        callbackUrl: "/auth/success",
        prompt: "select_account",
      })
    } catch {
      toast.error("Unable to start Google sign-in")
      setGoogleLoading(false)
    }
  }

  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage("")

    if (!email || !password) {
      toast.error("Please fill all fields")
      return
    }

    try {
      setSubmitting(true)
      clearAllSessions()

      const data = await apiClient.post<AuthResponse>("/api/auth/login", {
        email: email.trim(),
        password,
      })

      if (!data) {
        throw new Error(getLastApiErrorMessage() || "Login failed")
      }

      const token = data.token

      console.debug("[auth] login response", {
        hasToken: Boolean(token),
        userId: data.user?.id,
        role: data.user?.role || "student",
      })

      if (!token || !data.user) {
        throw new Error("Invalid response from server")
      }

      storeAuthSession(token, data.user)
      const nextRoute = resolvePostAuthRoute(data.user)

      toast.success("Login successful!")
      router.replace(nextRoute)
    } catch (error: unknown) {
      clearAuthSession()
      const message = getApiErrorMessage(error, "Invalid email or password")
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
      <form
        onSubmit={handleSignin}
        className="w-full max-w-md bg-[#1A0F2E] p-8 rounded-xl border border-purple-900/40"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign In
        </h2>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => void handleGoogleSignin()}
            disabled={googleLoading || submitting}
            className="w-full py-3 rounded-lg border border-purple-700 hover:bg-purple-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? "Opening Google..." : "Continue with Google"}
          </button>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-[#0A0A0F] border border-purple-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-[#0A0A0F] border border-purple-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          {errorMessage ? (
            <p className="text-sm text-red-300">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <p className="text-sm text-gray-400 text-center mt-6">
          <Link href="/forgot-password" className="text-purple-400">
            Forgot password?
          </Link>
        </p>

        <p className="text-sm text-gray-400 text-center mt-3">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-purple-400">
            Create account
          </Link>
        </p>
      </form>
    </div>
  )
}
