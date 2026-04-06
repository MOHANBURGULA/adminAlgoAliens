export function getApiErrorMessage(error: any, fallback = "Something went wrong"): string {
  const message = error?.response?.data?.message ?? error?.message

  if (Array.isArray(message)) {
    return message.find((entry) => typeof entry === "string" && entry.trim()) || fallback
  }

  if (typeof message === "string" && message.trim()) {
    return message
  }

  return fallback
}
