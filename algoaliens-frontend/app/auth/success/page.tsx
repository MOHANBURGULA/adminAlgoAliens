"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { clearAuthSession, resolvePostAuthRoute, storeAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

export default function AuthSuccessPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      clearAuthSession()
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
        const response = await apiClient.post("/api/auth/google", {
          email,
          name,
        })

        const token = response.data.token || response.data.access_token

        if (!token || !response.data.user) {
          throw new Error("Invalid response from server")
        }

        storeAuthSession(token, response.data.user)
        const nextRoute = await resolvePostAuthRoute()

        router.replace(nextRoute)
      } catch (error: any) {
        clearAuthSession()

        if (error?.response?.status === 400) {
          toast.error(error.response?.data?.message || "Google login failed")
        } else {
          toast.error("Unable to complete Google login")
        }

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
