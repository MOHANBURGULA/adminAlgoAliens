"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SessionProvider } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import ThemeSwitcher from "@/components/theme/ThemeSwitcher"
import { getStoredToken, hasAdminAccess } from "@/lib/auth"
import {
  fetchAuthenticatedProfile,
  getUnauthorizedRedirect,
  isAdminRoute,
  isOnboardingRoute,
  isProtectedUserRoute,
  isPublicRoute,
  isResetPasswordRoute,
  isUserAuthRoute,
  requiresOnboardingCheck,
  resolveAuthenticatedRedirect,
  validateStoredSession,
} from "@/lib/auth-guard"
import { registerUnauthorizedHandler } from "@/lib/auth-events"
import { APP_ROUTES } from "@/lib/routes"
import ToastViewport from "@/components/ui/toast"

function FullscreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(44,226,208,0.12),transparent_35%),radial-gradient(circle_at_bottom,rgba(184,41,168,0.14),transparent_40%),var(--bg-base)] px-6 text-center">
      <div
        className="w-full max-w-md rounded-[calc(var(--card-radius)+1rem)] p-8"
        style={{
          background: "var(--panel-background)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow-strong)",
        }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={24} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-theme-main">Preparing your workspace</h2>
        <p className="mt-2 text-sm leading-7 text-theme-muted">
          Checking your session and onboarding status so we land you in the right place.
        </p>
      </div>
    </div>
  )
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingAccess, setCheckingAccess] = useState(
    () => isProtectedUserRoute(pathname) || isAdminRoute(pathname) || isOnboardingRoute(pathname),
  )

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
      const token = getStoredToken()
      const publicRoute = isPublicRoute(pathname)
      const resetPasswordRoute = isResetPasswordRoute(pathname)
      const userAuthRoute = isUserAuthRoute(pathname)
      const onboardingRoute = isOnboardingRoute(pathname)
      const protectedUserRoute = isProtectedUserRoute(pathname)
      const adminRoute = isAdminRoute(pathname)
      const shouldValidateSession =
        Boolean(token) &&
        (adminRoute || protectedUserRoute || userAuthRoute || requiresOnboardingCheck(pathname))

      try {
        if (resetPasswordRoute || pathname === APP_ROUTES.AUTH_SUCCESS) {
          setCheckingAccess(false)
          return
        }

        if (!token) {
          if (adminRoute || protectedUserRoute) {
            router.replace(getUnauthorizedRedirect(pathname))
            return
          }

          setCheckingAccess(false)
          return
        }

        if (!shouldValidateSession) {
          setCheckingAccess(false)
          return
        }

        setCheckingAccess(true)

        const user = await validateStoredSession()

        if (cancelled) {
          return
        }

        if (!user) {
          if (publicRoute) {
            setCheckingAccess(false)
            return
          }

          router.replace(getUnauthorizedRedirect(pathname))
          return
        }

        if (adminRoute) {
          if (!hasAdminAccess(user)) {
            router.replace(await resolveAuthenticatedRedirect(user))
            return
          }

          setCheckingAccess(false)
          return
        }

        if (hasAdminAccess(user)) {
          if (userAuthRoute || onboardingRoute || protectedUserRoute) {
            router.replace(await resolveAuthenticatedRedirect(user))
            return
          }

          setCheckingAccess(false)
          return
        }

        if (userAuthRoute) {
          router.replace(await resolveAuthenticatedRedirect(user))
          return
        }

        if (requiresOnboardingCheck(pathname)) {
          const profile = await fetchAuthenticatedProfile()

          if (cancelled) {
            return
          }

          if (!profile) {
            router.replace(APP_ROUTES.SIGNIN)
            return
          }

          if (onboardingRoute) {
            if (profile.onboarding_completed) {
              router.replace(APP_ROUTES.DASHBOARD)
              return
            }

            setCheckingAccess(false)
            return
          }

          if (!profile.onboarding_completed) {
            router.replace(APP_ROUTES.ONBOARDING)
            return
          }
        }

        setCheckingAccess(false)
      } catch {
        if (!cancelled) {
          if (publicRoute) {
            setCheckingAccess(false)
            return
          }

          router.replace(getUnauthorizedRedirect(pathname))
        }
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (checkingAccess) {
    return <FullscreenLoader />
  }

  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthBootstrap>
          {children}
          <ThemeSwitcher />
          <ToastViewport />
        </AuthBootstrap>
      </ThemeProvider>
    </SessionProvider>
  )
}
