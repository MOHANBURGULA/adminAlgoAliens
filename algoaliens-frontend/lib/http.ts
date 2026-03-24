import axios from "axios"

type ApiErrorPayload = {
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as ApiErrorPayload | undefined)?.message ||
      error.message ||
      fallback
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function isAxiosStatus(error: unknown, status: number) {
  return axios.isAxiosError(error) && error.response?.status === status
}
