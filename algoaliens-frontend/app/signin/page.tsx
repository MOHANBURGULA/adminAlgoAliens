"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { clearAuthSession, resolvePostAuthRoute, storeAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

export default function SigninPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill all fields")
      return
    }

    try {
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      })

      const token = response.data.token || response.data.access_token

      if (!token || !response.data.user) {
        throw new Error("Invalid response from server")
      }

      storeAuthSession(token, response.data.user)
      const nextRoute = await resolvePostAuthRoute()

      toast.success("Login successful!")
      router.replace(nextRoute)
    } catch (error: any) {
      clearAuthSession()
      toast.error(
        error.response?.data?.message || "Invalid email or password",
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
      <form
        onSubmit={handleSignin}
        className="w-full max-w-md bg-[#1A0F2E] p-8 rounded-xl border border-purple-900/40"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign In
        </h2>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/auth/success" })}
            className="w-full py-3 rounded-lg border border-purple-700 hover:bg-purple-900/40"
          >
            Continue with Google
          </button>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-[#0A0A0F] border border-purple-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-[#0A0A0F] border border-purple-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400"
          >
            Sign In
          </button>
        </div>

        <p className="text-sm text-gray-400 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-purple-400">
            Create account
          </Link>
        </p>
      </form>
    </div>
  )
}
