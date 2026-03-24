"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      setSubmitting(true)

      const response = await apiClient.post("/api/auth/reset-password", {
        token: params.token,
        newPassword,
      })

      toast.success(response.data?.message || "Password reset successfully.")
      router.replace("/signin")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to reset password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#1A0F2E] p-8 rounded-xl border border-purple-900/40"
      >
        <h2 className="text-2xl font-bold mb-3 text-center">
          Reset Password
        </h2>

        <p className="mb-6 text-center text-sm text-gray-400">
          Enter a new password for your account.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full p-3 rounded-lg bg-[#0A0A0F] border border-purple-700"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full p-3 rounded-lg bg-[#0A0A0F] border border-purple-700"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        <p className="text-sm text-gray-400 text-center mt-6">
          <Link href="/signin" className="text-purple-400">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
