"use client"

import { apiClient } from "./axios"

export const USER_TOKEN_KEY = "token"
export const USER_KEY = "user"
export const ADMIN_TOKEN_KEY = "adminToken"
export const ADMIN_USER_KEY = "adminUser"

export type StoredUser = {
  id: number
  name: string
  email: string
  role?: string
}

export function getActiveToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(USER_TOKEN_KEY)
}

export function storeAuthSession(token: string, user: StoredUser) {
  localStorage.setItem(USER_TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function storeAdminSession(token: string, user: StoredUser) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(USER_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem("profileSetup")
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function clearAllSessions() {
  clearAuthSession()
  clearAdminSession()
}

export function getStoredAdminUser() {
  const value = localStorage.getItem(ADMIN_USER_KEY)
  return value ? (JSON.parse(value) as StoredUser) : null
}

export async function resolvePostAuthRoute() {
  try {
    await apiClient.get("/api/users/profile")
    return "/dashboard"
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return "/profile-setup"
    }

    throw error
  }
}

export async function hydrateCurrentUser() {
  const response = await apiClient.get("/api/users/me")
  localStorage.setItem(USER_KEY, JSON.stringify(response.data))
  return response.data as StoredUser
}

export async function hydrateAdminUser() {
  const response = await apiClient.get("/api/users/me")
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.data))
  return response.data as StoredUser
}
