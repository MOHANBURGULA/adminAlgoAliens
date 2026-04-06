import dns from "node:dns"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { googleConfig, nextAuthConfig } from "@/config/auth.config"

try {
  dns.setDefaultResultOrder("ipv4first")
} catch {
  // Ignore unsupported runtimes; NextAuth can still fall back to the default DNS order.
}

const DEFAULT_GOOGLE_OAUTH_TIMEOUT_MS = 15_000

function getGoogleOauthTimeoutMs() {
  const value = Number.parseInt(process.env.GOOGLE_OAUTH_TIMEOUT_MS ?? "", 10)

  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_GOOGLE_OAUTH_TIMEOUT_MS
}

// Centralize the Google auth setup so both client hooks and API routes use one config.
export const authOptions: AuthOptions = {
  // Keep the session JWT-based because this app exchanges Google login for a backend token.
  session: {
    strategy: "jwt",
  },
  secret: nextAuthConfig.secret,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      httpOptions: {
        timeout: getGoogleOauthTimeoutMs(),
      },
    }),
  ],
}
