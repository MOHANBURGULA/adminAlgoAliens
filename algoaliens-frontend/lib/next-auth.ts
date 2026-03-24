import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Centralize the Google auth setup so both client hooks and API routes use one config.
export const authOptions: AuthOptions = {
  // Keep the session JWT-based because this app exchanges Google login for a backend token.
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
}
