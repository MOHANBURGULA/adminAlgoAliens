function getRequiredEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "NEXTAUTH_SECRET") {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getGoogleCallbackUrl() {
  const value = process.env.GOOGLE_CALLBACK_URL?.trim()

  return value || "http://localhost:3000/api/auth/callback/google"
}

export const googleConfig = {
  clientID: getRequiredEnv("GOOGLE_CLIENT_ID"),
  clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
  callbackURL: getGoogleCallbackUrl(),
}

export const nextAuthConfig = {
  secret: getRequiredEnv("NEXTAUTH_SECRET"),
}
