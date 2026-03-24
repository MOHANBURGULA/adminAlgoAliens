"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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

export default function AuthSuccessPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (status === "unauthenticated" && !hasStarted.current) {
      clearAllSessions()
      router.replace("/signup")
      return
    }

    if (status !== "authenticated" || hasStarted.current) {
      return
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
        const nextRoute = resolvePostAuthRoute(data.user)
        toast.success(`Signed in as ${data.user.name || data.user.email}`)

        router.replace(nextRoute)
      } catch (error: unknown) {
        clearAuthSession()
        toast.error(getApiErrorMessage(error, "Unable to complete Google login"))

        router.replace("/signup")
      }
    }

    void finishGoogleLogin()
  }, [router, session, status])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070312] text-white">
      Finalizing your sign-in...
    </div>
  )
}
