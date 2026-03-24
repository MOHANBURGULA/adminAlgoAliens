"use client"

import { clearAuthSession, getStoredToken, resolvePostAuthRoute, storeAuthSession, type StoredUser } from "./auth"
import { apiClient } from "./api-client"

const PUBLIC_ROUTES = new Set([
  "/",
  "/courses",
  "/signin",
  "/signup",
  "/forgot-password",
  "/auth/success",
  "/admin/login",
])

const USER_AUTH_ROUTES = new Set([
  "/signin",
  "/signup",
  "/forgot-password",
])

export function isPublicRoute(pathname?: string | null) {
  return pathname ? PUBLIC_ROUTES.has(pathname) : false
}

export function isResetPasswordRoute(pathname?: string | null) {
  return pathname?.startsWith("/reset-password/") ?? false
}

export function isUserAuthRoute(pathname?: string | null) {
  return pathname ? USER_AUTH_ROUTES.has(pathname) : false
}

export function isAdminRoute(pathname?: string | null) {
  return Boolean(pathname?.startsWith("/admin") && pathname !== "/admin/login")
}

export function getUnauthorizedRedirect(pathname?: string | null) {
  return isAdminRoute(pathname) ? "/admin/login" : "/signin"
}

export function getAuthenticatedRedirect(user?: StoredUser | null) {
  return resolvePostAuthRoute(user)
}

export async function validateStoredSession() {
  const token = getStoredToken()

  if (!token) {
    return null
  }

  try {
    const user = await apiClient.get<StoredUser>("/api/users/me")

    if (!user) {
      console.warn("Session validation failed")
      clearAuthSession()
      return null
    }

    storeAuthSession(token, user)
    return user
  } catch {
    console.warn("Session validation failed")
    clearAuthSession()
    return null
  }
}
