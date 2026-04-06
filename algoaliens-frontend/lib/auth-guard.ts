"use client"

import {
  clearAuthSession,
  getStoredToken,
  resolvePostAuthRoute,
  storeAuthSession,
  type StoredUser,
} from "./auth"
import { apiClient } from "./api-client"
import { normalizeUserProfile, type UserProfileData } from "./profile"
import {
  APP_ROUTES,
  getUnauthorizedRedirect,
  isAdminRoute,
  isOnboardingRoute,
  isProtectedUserRoute,
  isPublicRoute,
  isResetPasswordRoute,
  isUserAuthRoute,
  requiresOnboardingCheck,
} from "./routes"

export {
  getUnauthorizedRedirect,
  isAdminRoute,
  isOnboardingRoute,
  isProtectedUserRoute,
  isPublicRoute,
  isResetPasswordRoute,
  isUserAuthRoute,
  requiresOnboardingCheck,
}

export async function fetchAuthenticatedProfile() {
  const profile = await apiClient.get<UserProfileData>("/api/profile")

  if (!profile) {
    clearAuthSession()
    return null
  }

  return normalizeUserProfile(profile)
}

export async function resolveAuthenticatedRedirect(user?: StoredUser | null) {
  if (!user) {
    return APP_ROUTES.SIGNIN
  }

  const profile = await fetchAuthenticatedProfile()
  if (!profile) {
    return APP_ROUTES.SIGNIN
  }

  return profile.onboarding_completed ? resolvePostAuthRoute(user) : APP_ROUTES.ONBOARDING
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
