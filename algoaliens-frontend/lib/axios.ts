import axios from "axios"
import { clearAuthSession, getStoredToken } from "./auth"
import { notifyUnauthorized } from "./auth-events"
import { API_BASE_URL } from "./api-base-url"

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
