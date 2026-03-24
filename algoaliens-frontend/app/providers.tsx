"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SessionProvider } from "next-auth/react"
import {
  getAuthenticatedRedirect,
  getUnauthorizedRedirect,
  isAdminRoute,
  isPublicRoute,
  isResetPasswordRoute,
  validateStoredSession,
} from "@/lib/auth-guard"
import { registerUnauthorizedHandler } from "@/lib/auth-events"
import ToastViewport from "@/components/ui/toast"

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      if (isPublicRoute(pathname) || isResetPasswordRoute(pathname)) {
        return
      }

      router.replace(getUnauthorizedRedirect(pathname))
    })
  }, [pathname, router])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const publicRoute = isPublicRoute(pathname)
      const resetPasswordRoute = isResetPasswordRoute(pathname)

      if (publicRoute || resetPasswordRoute) {
        return
      }

      try {
        const user = await validateStoredSession()

        if (cancelled) {
          return
        }

        if (!user) {
          router.replace(getUnauthorizedRedirect(pathname))
          return
        }

        if (isAdminRoute(pathname) && user.role !== "admin") {
          router.replace(getAuthenticatedRedirect(user))
          return
        }
      } catch {
        if (!cancelled && !isPublicRoute(pathname) && !isResetPasswordRoute(pathname)) {
          console.warn("Auth bootstrap ignored")
          router.replace(getUnauthorizedRedirect(pathname))
        }
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthBootstrap>
        {children}
        <ToastViewport />
      </AuthBootstrap>
    </SessionProvider>
  )
}
