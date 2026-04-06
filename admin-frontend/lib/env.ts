function normalizeUrl(value: string | undefined) {
  return value?.trim().replace(/\/$/, "")
}

export function getPublicApiUrl() {
  const apiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_URL)

  if (!apiUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Set it in admin-frontend/.env.local before starting the app.",
    )
  }

  return apiUrl
}

export function getPublicAppUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)
}
