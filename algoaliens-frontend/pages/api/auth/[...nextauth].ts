import NextAuth from "next-auth"
import { authOptions } from "@/lib/next-auth"

// Serve the NextAuth endpoints from the Pages Router so /api/auth/* resolves reliably.
export default NextAuth(authOptions)
