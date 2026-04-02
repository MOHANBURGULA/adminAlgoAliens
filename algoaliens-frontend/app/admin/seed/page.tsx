"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { seedDsaCourse } from "@/lib/admin"
import { getApiErrorMessage } from "@/lib/http"

export default function AdminSeedPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState("")

  const handleSeed = async () => {
    try {
      setRunning(true)
      const course = await seedDsaCourse()
      setResult(`Seed complete for course ${course.title} (#${course.id}).`)
      toast.success("DSA seed flow completed")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to seed data."))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Seed DSA Test Data</h1>
        <p className="mt-2 text-sm text-gray-400">
          Creates the Data Structures & Algorithms course, six modules, PDFs, and
          quiz questions using only existing admin APIs.
        </p>
      </div>

      <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-8">
        <button
          type="button"
          onClick={() => void handleSeed()}
          disabled={running}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Seeding..." : "Run DSA Seed"}
        </button>

        {result && <p className="mt-4 text-sm text-green-300">{result}</p>}
      </div>
    </div>
  )
}
