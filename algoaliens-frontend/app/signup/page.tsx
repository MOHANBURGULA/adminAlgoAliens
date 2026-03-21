"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { clearAuthSession, resolvePostAuthRoute, storeAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      toast.error("Enter a valid email")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!acceptedTerms) {
      toast.error("Please accept Terms and Privacy Policy")
      return
    }

    try {
      const response = await apiClient.post("/api/auth/signup", {
        name,
        email,
        password,
      })

      const token = response.data.token || response.data.access_token

      if (!token || !response.data.user) {
        throw new Error("Invalid response from server")
      }

      storeAuthSession(token, response.data.user)
      const nextRoute = await resolvePostAuthRoute()

      toast.success("Account created successfully!")
      router.replace(nextRoute)
    } catch (error: any) {
      clearAuthSession()
      toast.error(error.response?.data?.message || "Signup failed")
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0F]">
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-[#0A0A0F] text-white">
        <div className="max-w-md px-12">
          <h1 className="text-4xl font-bold mb-4">Start your journey</h1>
          <p className="text-purple-200">
            Join developers and earn trusted certificates.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-16 bg-gradient-to-br from-[#0A0A0F] to-[#1A0F2E]">
        <form onSubmit={handleSignup} className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-purple-400">
            Create an account
          </h2>

          <p className="text-gray-400 mb-6">
            Get started with AlgoAliens
          </p>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/auth/success" })}
            className="w-full mb-6 py-3.5 rounded-xl border border-purple-700 hover:bg-purple-900/50 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>

            Continue with Google
          </button>

          <div className="text-center text-gray-500 my-4">OR</div>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full mb-3 p-3 rounded bg-[#1A0F2E]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-3 rounded bg-[#1A0F2E]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 p-3 rounded bg-[#1A0F2E]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full mb-3 p-3 rounded bg-[#1A0F2E]"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="flex items-center gap-2 mb-4 text-sm">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>I agree to Terms</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-500 rounded"
          >
            Create Account
          </button>

          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link href="/signin" className="text-purple-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
