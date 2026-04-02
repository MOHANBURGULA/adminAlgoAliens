"use client"

export const USER_TOKEN_KEY = "token"
export const USER_KEY = "user"

type Nullable<T> = T | null

export type StoredUser = {
  id: number
  name: string
  email: string
  role?: string
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage
}

function removeLegacyAuthKeys() {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.removeItem("adminToken")
  storage.removeItem("adminUser")
  storage.removeItem("profileSetup")
}

function parseStoredUser(rawUser: Nullable<string>) {
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as StoredUser
  } catch {
    return null
  }
}

export function getStoredToken() {
  return getBrowserStorage()?.getItem(USER_TOKEN_KEY) || null
}

export function getStoredUser() {
  return parseStoredUser(getBrowserStorage()?.getItem(USER_KEY) || null)
}

export function isAuthenticated() {
  return Boolean(getStoredToken())
}

export function isAdminUser(user?: Nullable<StoredUser>) {
  return (user || getStoredUser())?.role === "admin"
}

export function storeAuthSession(token: string, user: StoredUser) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.setItem(USER_TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
  removeLegacyAuthKeys()

  console.debug("[auth] stored session", {
    userId: user.id,
    role: user.role || "student",
    hasToken: Boolean(token),
  })
}

export function storeAdminSession(token: string, user: StoredUser) {
  storeAuthSession(token, user)
}

export function clearAuthSession() {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.removeItem(USER_TOKEN_KEY)
  storage.removeItem(USER_KEY)
  removeLegacyAuthKeys()
}

export function clearAdminSession() {
  clearAuthSession()
}

export function clearAllSessions() {
  clearAuthSession()
}

export function getStoredAdminUser() {
  const user = getStoredUser()
  return user?.role === "admin" ? user : null
}

export function resolvePostAuthRoute(user?: Nullable<StoredUser>) {
  return isAdminUser(user) ? "/admin/dashboard" : "/dashboard"
}
