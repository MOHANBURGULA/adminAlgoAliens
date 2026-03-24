"use client"

import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState("")
  const [noticeType, setNoticeType] = useState<"success" | "error" | "">("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setNotice("")
      setNoticeType("")

      const response = await apiClient.post("/api/auth/change-password")
      const message = response.data?.message || "Password reset email sent successfully."
      setNotice(message)
      setNoticeType("success")
      toast.success(message)
    } catch (error: unknown) {
      const responseError = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const message =
        responseError?.response?.data?.message ||
        responseError?.message ||
        "Please sign in first to request a reset link."
      setNotice(message)
      setNoticeType("error")
      toast.error(message)
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
          Send a password reset link to your registered email address.
        </p>

        {notice ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              noticeType === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-100"
            }`}
          >
            {notice}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="text-sm text-gray-400 text-center mt-6">
          <Link href="/signin" className="text-purple-400">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
