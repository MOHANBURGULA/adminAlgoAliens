import axios from "axios"

export const apiClient = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
})

let unauthorizedInterceptorId: number | null = null

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

export function registerUnauthorizedHandler(onUnauthorized: () => void) {
  if (unauthorizedInterceptorId !== null) {
    apiClient.interceptors.response.eject(unauthorizedInterceptorId)
  }

  unauthorizedInterceptorId = apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("adminToken")
          localStorage.removeItem("adminUser")
          localStorage.removeItem("profileSetup")
        }

        onUnauthorized()
      }

      return Promise.reject(error)
    },
  )

  return () => {
    if (unauthorizedInterceptorId !== null) {
      apiClient.interceptors.response.eject(unauthorizedInterceptorId)
      unauthorizedInterceptorId = null
    }
  }
}
