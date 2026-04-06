const DEFAULT_API_BASE_URL = "http://localhost:3001"

function isLoopbackHost(hostname: string) {
  return hostname === "127.0.0.1" || hostname === "localhost"
}

function normalizeBaseUrl(rawBaseUrl?: string) {
  const fallback = DEFAULT_API_BASE_URL
  const trimmed = rawBaseUrl?.trim()
  const initial = (trimmed || fallback).replace(/\/$/, "")

  if (typeof window === "undefined") {
    return initial
  }

  try {
    const url = new URL(initial)
    const currentHostname = window.location.hostname

    if (isLoopbackHost(url.hostname) && isLoopbackHost(currentHostname)) {
      url.hostname = currentHostname
      return url.toString().replace(/\/$/, "")
    }

    return initial
  } catch {
    return fallback
  }
}

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)

export function getApiConnectionErrorMessage(path: string) {
  return `Unable to reach the backend at ${API_BASE_URL}${path}. Make sure the API server is running on port 3001 and the frontend API URL uses the correct local host.`
}
