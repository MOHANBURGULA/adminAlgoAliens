import { FEATURES } from "@/config/features"

export const APP_ROUTES = {
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_LOGIN: "/admin/login",
  AUTH_SUCCESS: "/auth/success",
  CERTIFICATES: "/certificates",
  COURSES: "/courses",
  DASHBOARD: "/dashboard",
  FORGOT_PASSWORD: "/forgot-password",
  HOME: "/",
  MY_COURSES: "/my-courses",
  ONBOARDING: "/onboarding",
  PROFILE: "/profile",
  PROFILE_SETUP: "/profile-setup",
  PROJECTS: "/projects",
  RESET_PASSWORD_PREFIX: "/reset-password/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  UPLOAD: "/upload",
  VIDEO_UPLOAD: "/video-upload",
} as const

const USER_AUTH_ROUTES = new Set<string>([
  APP_ROUTES.SIGNIN,
  APP_ROUTES.SIGNUP,
  APP_ROUTES.FORGOT_PASSWORD,
])

const PUBLIC_ROUTES = new Set<string>([
  APP_ROUTES.HOME,
  APP_ROUTES.SIGNIN,
  APP_ROUTES.SIGNUP,
  APP_ROUTES.FORGOT_PASSWORD,
  APP_ROUTES.AUTH_SUCCESS,
])

const SIDEBARLESS_ROUTES = new Set<string>([
  APP_ROUTES.HOME,
  APP_ROUTES.SIGNIN,
  APP_ROUTES.SIGNUP,
  APP_ROUTES.FORGOT_PASSWORD,
  APP_ROUTES.ONBOARDING,
  APP_ROUTES.PROFILE_SETUP,
  APP_ROUTES.AUTH_SUCCESS,
])

const ONBOARDING_CHECK_ROUTES = new Set<string>([
  APP_ROUTES.DASHBOARD,
  APP_ROUTES.PROFILE,
  APP_ROUTES.MY_COURSES,
  APP_ROUTES.PROJECTS,
  APP_ROUTES.UPLOAD,
  APP_ROUTES.VIDEO_UPLOAD,
  APP_ROUTES.CERTIFICATES,
])

export function isAdminPath(pathname?: string | null) {
  return Boolean(pathname?.startsWith(APP_ROUTES.ADMIN))
}

export function isAdminRoute(pathname?: string | null) {
  return Boolean(pathname?.startsWith(APP_ROUTES.ADMIN) && pathname !== APP_ROUTES.ADMIN_LOGIN)
}

export function isPublicRoute(pathname?: string | null) {
  if (!pathname) {
    return false
  }

  if (PUBLIC_ROUTES.has(pathname)) {
    return true
  }

  const segments = pathname.split("/").filter(Boolean)
  return segments[0] === "courses" && segments.length === 2
}

export function isResetPasswordRoute(pathname?: string | null) {
  return pathname?.startsWith(APP_ROUTES.RESET_PASSWORD_PREFIX) ?? false
}

export function isUserAuthRoute(pathname?: string | null) {
  return pathname ? USER_AUTH_ROUTES.has(pathname) : false
}

export function isOnboardingRoute(pathname?: string | null) {
  return pathname === APP_ROUTES.ONBOARDING || pathname === APP_ROUTES.PROFILE_SETUP
}

export function isProtectedUserRoute(pathname?: string | null) {
  if (!pathname) {
    return false
  }

  if (
    isPublicRoute(pathname) ||
    isUserAuthRoute(pathname) ||
    isResetPasswordRoute(pathname) ||
    isAdminPath(pathname)
  ) {
    return false
  }

  return true
}

export function requiresOnboardingCheck(pathname?: string | null) {
  if (!pathname) {
    return false
  }

  if (
    isAdminPath(pathname) ||
    isUserAuthRoute(pathname) ||
    isResetPasswordRoute(pathname) ||
    pathname === APP_ROUTES.HOME ||
    pathname === APP_ROUTES.AUTH_SUCCESS
  ) {
    return false
  }

  if (isOnboardingRoute(pathname)) {
    return true
  }

  if (ONBOARDING_CHECK_ROUTES.has(pathname)) {
    return true
  }

  return pathname === APP_ROUTES.COURSES || pathname.startsWith(`${APP_ROUTES.COURSES}/`)
}

export function getUnauthorizedRedirect(pathname?: string | null) {
  if (isAdminPath(pathname)) {
    return FEATURES.ENABLE_ADMIN ? APP_ROUTES.ADMIN_LOGIN : APP_ROUTES.HOME
  }

  return APP_ROUTES.SIGNIN
}

export function shouldHideAppSidebar(pathname?: string | null) {
  if (!pathname) {
    return true
  }

  if (isAdminPath(pathname) || isResetPasswordRoute(pathname)) {
    return true
  }

  if (SIDEBARLESS_ROUTES.has(pathname)) {
    return true
  }

  return pathname !== APP_ROUTES.HOME && isPublicRoute(pathname)
}
