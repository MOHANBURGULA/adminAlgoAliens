"use client"

import Link from "next/link"
import { signIn, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import {
  clearAllSessions,
  clearAuthSession,
  storeAuthSession,
} from "@/lib/auth"
import { resolveAuthenticatedRedirect } from "@/lib/auth-guard"
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

function getOauthErrorMessage(error: string | null) {
  switch (error) {
    case "AccessDenied":
      return "Google sign-in was cancelled before it could finish."
    case "OAuthCallback":
    case "OAuthSignin":
      return "Google sign-in timed out. Please try again. If it keeps failing, use email and password for now."
    default:
      return ""
  }
}

function SigninPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const oauthErrorMessage = getOauthErrorMessage(searchParams?.get("error") ?? null)

  useEffect(() => {
    if (!oauthErrorMessage) {
      return
    }

    setErrorMessage(oauthErrorMessage)
  }, [oauthErrorMessage])

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

  const handleSignin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

      if (!data.token || !data.user) {
        throw new Error("Invalid response from server")
      }

      storeAuthSession(data.token, data.user)
      router.replace(await resolveAuthenticatedRedirect(data.user))
      toast.success("Login successful!")
    } catch (error: unknown) {
      clearAuthSession()
      const message = getApiErrorMessage(error, "Invalid email or password")
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSignin}
        className="theme-auth-card w-full max-w-md p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-semibold accent-gradient-text">Sign in</h1>
          <p className="mt-2 text-theme-muted">Enter your credentials to continue learning</p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleSignin()}
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

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-theme-main">Email</label>
            <input
              type="email"
              className="input-ui"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              placeholder="hello@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-theme-main">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-ui pr-12"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted transition hover:text-theme-main"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        <div className="mt-6 flex justify-between text-sm text-theme-muted">
          <Link href="/forgot-password" className="theme-link-muted">
            Forgot password
          </Link>
          <Link href="/signup" className="theme-link-muted">
            Create account
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 py-10 text-theme-muted">
          Loading sign in...
        </div>
      }
    >
      <SigninPageContent />
    </Suspense>
  )
}
