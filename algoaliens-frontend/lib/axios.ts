import axios from "axios"
import { clearAuthSession, getStoredToken } from "./auth"
import { notifyUnauthorized } from "./auth-events"

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:3001").replace(/\/$/, "")

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config
  }

  const token = getStoredToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession()
      notifyUnauthorized()
    }

    return Promise.reject(error)
  },
)
