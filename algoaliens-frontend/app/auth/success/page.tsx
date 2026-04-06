"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { clearAllSessions, clearAuthSession, storeAuthSession } from "@/lib/auth"
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

type GoogleExchangeResult = {
  nextRoute: string
  displayName: string
}

let activeGoogleExchangeKey: string | null = null
let activeGoogleExchangePromise: Promise<GoogleExchangeResult> | null = null

function getGoogleExchangeKey(email: string, name: string) {
  return `${email.toLowerCase()}::${name.trim()}`
}

function startGoogleExchange(email: string, name: string) {
  const exchangeKey = getGoogleExchangeKey(email, name)

  if (activeGoogleExchangeKey === exchangeKey && activeGoogleExchangePromise) {
    return activeGoogleExchangePromise
  }

  activeGoogleExchangeKey = exchangeKey
  activeGoogleExchangePromise = (async () => {
    clearAllSessions()

    const data = await apiClient.post<AuthResponse>("/api/auth/google", {
      email,
      name,
    })

    if (!data) {
      throw new Error(getLastApiErrorMessage() || "Unable to complete Google login")
    }

    const token = data.token

    console.debug("[auth] google login response", {
      hasToken: Boolean(token),
      userId: data.user?.id,
      role: data.user?.role || "student",
    })

    if (!token || !data.user) {
      throw new Error("Invalid response from server")
    }

    storeAuthSession(token, data.user)
    const nextRoute = await resolveAuthenticatedRedirect(data.user)

    return {
      nextRoute,
      displayName: data.user.name || data.user.email,
    }
  })().finally(() => {
    activeGoogleExchangeKey = null
    activeGoogleExchangePromise = null
  })

  return activeGoogleExchangePromise
}

export default function AuthSuccessPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const hasStarted = useRef(false)

  useEffect(() => {
    let cancelled = false

    if (status === "loading") {
      return () => {
        cancelled = true
      }
    }

    if (status === "unauthenticated" && !hasStarted.current) {
      clearAllSessions()
      router.replace("/signup")
      return () => {
        cancelled = true
      }
    }

    if (status !== "authenticated" || hasStarted.current) {
      return () => {
        cancelled = true
      }
    }

    hasStarted.current = true

    const finishGoogleLogin = async () => {
      const email = session.user?.email
      const name = session.user?.name

      if (!email || !name) {
        clearAuthSession()
        toast.error("Google account details are incomplete")
        router.replace("/signup")
        return
      }

      try {
        const result = await startGoogleExchange(email, name)

        if (cancelled) {
          return
        }

        toast.success(`Signed in as ${result.displayName}`)
        router.replace(result.nextRoute)
      } catch (error: unknown) {
        if (cancelled) {
          return
        }

        console.error("[auth] google login exchange failed", error)
        clearAuthSession()
        toast.error(getApiErrorMessage(error, "Unable to complete Google login"))

        router.replace("/signup")
      }
    }

    void finishGoogleLogin()

    return () => {
      cancelled = true
    }
  }, [router, session, status])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070312] text-white">
      Finalizing your sign-in...
    </div>
  )
}
