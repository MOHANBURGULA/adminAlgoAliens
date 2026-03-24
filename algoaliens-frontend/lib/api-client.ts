"use client"

import { clearAuthSession, getStoredToken } from "./auth"

const API_BASE_URL = "http://localhost:3001"

type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT"

type RequestBody = Record<string, unknown> | null | undefined

type ErrorPayload = {
  message?: string
}

let lastApiErrorMessage = ""

export class ApiClientError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.payload = payload
  }
}

async function parseResponseBody(response: Response) {
  try {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      return await response.json()
    }

    const text = await response.text()
    return text ? { message: text } : null
  } catch {
    return null
  }
}

function buildHeaders() {
  const token = getStoredToken()
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as ErrorPayload).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return fallback
}

export function getLastApiErrorMessage() {
  return lastApiErrorMessage
}

async function request<T>(path: string, method: HttpMethod = "GET", body?: RequestBody) {
  lastApiErrorMessage = ""

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const errorMessage = getErrorMessage(payload, response.statusText || "Request failed")
    lastApiErrorMessage = errorMessage

    if (response.status === 401) {
      console.warn("[api-client] unauthorized request", {
        method,
        path,
        status: response.status,
        payload,
      })
      clearAuthSession()
      return null
    }

    console.error("[api-client] request failed", {
      method,
      path,
      status: response.status,
      payload,
    })

    throw new ApiClientError(errorMessage, response.status, payload)
  }

  return payload as T
}

export const apiClient = {
  delete<T>(path: string): Promise<T | null> {
    return request<T>(path, "DELETE")
  },
  get<T>(path: string): Promise<T | null> {
    return request<T>(path, "GET")
  },
  patch<T>(path: string, body?: RequestBody): Promise<T | null> {
    return request<T>(path, "PATCH", body)
  },
  post<T>(path: string, body?: RequestBody): Promise<T | null> {
    return request<T>(path, "POST", body)
  },
  put<T>(path: string, body?: RequestBody): Promise<T | null> {
    return request<T>(path, "PUT", body)
  },
}
