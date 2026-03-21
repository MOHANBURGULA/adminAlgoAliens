"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SessionProvider } from "next-auth/react"
import {
  clearAdminSession,
  clearAuthSession,
  getStoredAdminUser,
  hydrateAdminUser,
  hydrateCurrentUser,
} from "@/lib/auth"
import { registerUnauthorizedHandler } from "@/lib/axios"

const PUBLIC_ROUTES = new Set([
  "/",
  "/signin",
  "/signup",
  "/auth/success",
  "/admin/login",
])

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      if (pathname?.startsWith("/admin")) {
        router.replace("/admin/login")
        return
      }

      router.replace("/signin")
    })
  }, [pathname, router])

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      const isPublicRoute = pathname ? PUBLIC_ROUTES.has(pathname) : false
      const isAdminRoute = pathname?.startsWith("/admin") && pathname !== "/admin/login"

      if (isPublicRoute) {
        setIsReady(true)
        return
      }

      if (isAdminRoute) {
        const adminToken = localStorage.getItem("adminToken")

        if (!adminToken) {
          clearAdminSession()
          router.replace("/admin/login")
          setIsReady(true)
          return
        }

        try {
          const adminUser = await hydrateAdminUser()

          if (!cancelled && adminUser.role !== "admin") {
            clearAdminSession()
            router.replace("/signin")
            setIsReady(true)
            return
          }

          if (!cancelled) {
            setIsReady(true)
          }
        } catch {
          if (!cancelled) {
            clearAdminSession()
            router.replace("/admin/login")
            setIsReady(true)
          }
        }

        return
      }

      const token = localStorage.getItem("token")

      if (!token) {
        clearAuthSession()
        router.replace("/signin")
        setIsReady(true)
        return
      }

      try {
        await hydrateCurrentUser()

        if (!cancelled) {
          setIsReady(true)
        }
      } catch (error: any) {
        if (cancelled) {
          return
        }

        if (error?.response?.status === 404) {
          setIsReady(true)
          return
        }

        clearAuthSession()
        router.replace("/signin")
        setIsReady(true)
      }
    }

    if (pathname === "/admin/login") {
      const adminUser = getStoredAdminUser()

      if (localStorage.getItem("adminToken") && adminUser?.role === "admin") {
        router.replace("/admin/dashboard")
        setIsReady(true)
        return
      }
    }

    setIsReady(false)
    void bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  const isPublicRoute = pathname ? PUBLIC_ROUTES.has(pathname) : false

  if (!isPublicRoute && !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070312] text-white">
        Loading...
      </div>
    )
  }

  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthBootstrap>{children}</AuthBootstrap>
    </SessionProvider>
  )
}
