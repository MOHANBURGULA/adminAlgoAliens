"use client"

import { useEffect, useMemo, useState } from "react"
import { Award, CalendarDays, ExternalLink, Medal } from "lucide-react"
import { apiClient } from "@/lib/axios"

type Certificate = {
  id: number
  courseId: number
  score: number
  issuedAt: string
}

type Course = {
  id: number
  title: string
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [courseTitles, setCourseTitles] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadCertificates = async () => {
      try {
        setLoading(true)
        setError("")

        const certificatesRes = await apiClient.get("/api/certificates")
        const certificateData = certificatesRes.data as Certificate[]

        const courseResults = await Promise.allSettled(
          certificateData.map((certificate) =>
            apiClient.get(`/api/courses/${certificate.courseId}`),
          ),
        )

        const nextCourseTitles = certificateData.reduce<Record<number, string>>(
          (acc, certificate, index) => {
            const result = courseResults[index]
            const course =
              result.status === "fulfilled" ? (result.value.data as Course) : null
            acc[certificate.courseId] = course?.title || `Course #${certificate.courseId}`
            return acc
          },
          {},
        )

        if (!cancelled) {
          setCertificates(certificateData)
          setCourseTitles(nextCourseTitles)
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          const responseError = loadError as {
            response?: {
              status?: number
              data?: { message?: string }
            }
          }

          if (responseError?.response?.status === 404) {
            setCertificates([])
            setCourseTitles({})
            return
          }

          setError(
            responseError?.response?.data?.message || "Unable to load certificates.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCertificates()

    return () => {
      cancelled = true
    }
  }, [])

  const averageScore = useMemo(() => {
    if (certificates.length === 0) {
      return 0
    }

    const total = certificates.reduce((sum, certificate) => sum + certificate.score, 0)
    return Math.round(total / certificates.length)
  }, [certificates])

  if (loading) {
    return (
      <div className="card-ui flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading certificates...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  if (certificates.length === 0) {
    return (
      <div className="card-ui text-center text-gray-400">
        You have not earned any certificates yet.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">My Certificates</h1>
        <p className="mt-2 text-sm text-gray-400">
          Live certificate records issued by the backend.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="card-ui text-center">
          <Award className="mx-auto text-purple-300" size={22} />
          <p className="mt-4 text-3xl font-semibold text-white">
            {certificates.length}
          </p>
          <p className="mt-1 text-sm text-gray-400">Certificates earned</p>
        </div>

        <div className="card-ui text-center">
          <Medal className="mx-auto text-violet-200" size={22} />
          <p className="mt-4 text-3xl font-semibold text-white">
            {averageScore}
          </p>
          <p className="mt-1 text-sm text-gray-400">Average score</p>
        </div>

        <div className="card-ui text-center">
          <CalendarDays className="mx-auto text-fuchsia-200" size={22} />
          <p className="mt-4 text-lg font-semibold text-white">
            {formatDate(certificates[0].issuedAt)}
          </p>
          <p className="mt-1 text-sm text-gray-400">Latest issued date</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {certificates.map((certificate) => (
          <div
            key={certificate.id}
            className="card-ui"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Certificate #{certificate.id}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {courseTitles[certificate.courseId]}
                </h2>
              </div>

              <span className="rounded-full bg-purple-500/12 px-3 py-1 text-xs text-purple-100">
                Score {certificate.score}
              </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
              <div className="rounded-xl bg-[rgba(18,9,42,0.9)] p-4">
                <p className="text-gray-400">Course ID</p>
                <p className="mt-2 text-white">{certificate.courseId}</p>
              </div>

              <div className="rounded-xl bg-[rgba(18,9,42,0.9)] p-4">
                <p className="text-gray-400">Issued</p>
                <p className="mt-2 text-white">{formatDate(certificate.issuedAt)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                window.open(
                  `${apiClient.defaults.baseURL}/api/certificates/${certificate.id}/verify`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-purple-500/25 px-4 py-2 text-sm text-white transition-all duration-300 hover:scale-[1.02] hover:bg-purple-500/10"
            >
              View Certificate
              <ExternalLink size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
