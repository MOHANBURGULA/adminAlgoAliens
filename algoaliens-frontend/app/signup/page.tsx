"use client"

import Link from "next/link"
import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"
import {
  clearAllSessions,
  clearAuthSession,
  storeAuthSession,
} from "@/lib/auth"
import { resolveAuthenticatedRedirect } from "@/lib/auth-guard"
import { apiClient } from "@/lib/api-client"
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

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true)
      clearAllSessions()
      await signOut({ redirect: false })
      await signIn("google", {
        callbackUrl: "/auth/success",
        prompt: "select_account",
      })
    } catch {
      toast.error("Unable to start Google sign-up")
      setGoogleLoading(false)
    }
  }

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!acceptedTerms) {
      toast.error("Please accept Terms")
      return
    }

    try {
      setSubmitting(true)
      clearAllSessions()

      const data = await apiClient.post<AuthResponse>("/api/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
      })

      if (!data || !data.token || !data.user) {
        throw new Error("Signup failed")
      }

      storeAuthSession(data.token, data.user)
      router.replace(await resolveAuthenticatedRedirect(data.user))
      toast.success("Account created successfully!")
    } catch (error: unknown) {
      clearAuthSession()
      const message = getApiErrorMessage(error, "Signup failed")
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="theme-auth-card w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold accent-gradient-text">Create an account</h1>
          <p className="mt-2 text-theme-muted">Get started with AlgoAliens for free</p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleSignup()}
          disabled={googleLoading || submitting}
          className="theme-social-button flex w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span>{googleLoading ? "Opening..." : "Continue with Google"}</span>
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="theme-divider-line" />
          <span className="text-xs uppercase tracking-[0.18em] text-theme-muted">or</span>
          <div className="theme-divider-line" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-theme-main">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-ui"
              placeholder="John Doe"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-theme-main">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-ui"
              placeholder="hello@example.com"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-theme-main">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-ui"
              placeholder="Minimum 6 characters"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-theme-main">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-ui"
              placeholder="Confirm password"
              disabled={submitting}
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-theme-muted">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="h-4 w-4 rounded border"
              style={{
                accentColor: "var(--accent-magenta)",
                borderColor: "var(--border-color)",
              }}
              disabled={submitting}
            />
            <span>I agree to the Terms and Privacy Policy</span>
          </label>

          {errorMessage ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="theme-button-primary flex w-full gap-2 px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-theme-muted">
          Already have an account?{" "}
          <Link href="/signin" className="theme-link-muted">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
