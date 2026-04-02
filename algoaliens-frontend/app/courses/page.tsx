"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowRight, BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isAuthenticated } from "@/lib/auth"
import { clampProgress, getCourseProgressLabel } from "@/lib/course-progress"
import {
  enrollInCourse,
  fetchCourses,
  fetchEnrollments,
  fetchUserProfile,
  formatDifficulty,
  formatRelativeDate,
  normalizeDifficulty,
  type Course,
  type Enrollment,
  type UserProfile,
} from "@/lib/learning"

function getCourseCardTheme(difficulty: string) {
  const normalized = normalizeDifficulty(difficulty)

  if (normalized === "advanced") {
    return {
      accentGlow: "bg-fuchsia-500/16",
      accentLine: "from-transparent via-fuchsia-300/80 to-transparent",
      badge: "bg-fuchsia-500/12 text-fuchsia-100",
      meta: "border-fuchsia-400/15 bg-fuchsia-500/[0.05]",
      progress: "from-fuchsia-500 via-violet-500 to-purple-700",
      recommended: "bg-rose-500/12 text-rose-100",
    }
  }

  if (normalized === "intermediate") {
    return {
      accentGlow: "bg-violet-500/16",
      accentLine: "from-transparent via-violet-300/80 to-transparent",
      badge: "bg-violet-500/12 text-violet-100",
      meta: "border-violet-400/15 bg-violet-500/[0.05]",
      progress: "from-violet-500 via-purple-500 to-fuchsia-600",
      recommended: "bg-fuchsia-500/12 text-fuchsia-100",
    }
  }

  return {
    accentGlow: "bg-indigo-500/16",
    accentLine: "from-transparent via-indigo-300/80 to-transparent",
    badge: "bg-indigo-500/12 text-indigo-100",
    meta: "border-indigo-400/15 bg-indigo-500/[0.05]",
    progress: "from-indigo-400 via-violet-500 to-fuchsia-500",
    recommended: "bg-violet-500/12 text-violet-100",
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)

  useEffect(() => {
    const syncAuthState = () => {
      setAuthenticated(isAuthenticated())
    }

    syncAuthState()
    window.addEventListener("storage", syncAuthState)

    return () => {
      window.removeEventListener("storage", syncAuthState)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)
        setError("")

        const publicCourses = await fetchCourses()

        if (cancelled) {
          return
        }

        setCourses(publicCourses)

        if (!authenticated) {
          setEnrollments([])
          setProfile(null)
          return
        }

        const [enrollmentResult, profileResult] = await Promise.allSettled([
          fetchEnrollments(),
          fetchUserProfile(),
        ])

        if (cancelled) {
          return
        }

        setEnrollments(enrollmentResult.status === "fulfilled" ? enrollmentResult.value : [])
        setProfile(profileResult.status === "fulfilled" ? profileResult.value : null)
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError)
          setError("Unable to load the course catalog right now.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [authenticated])

  const enrollmentMap = useMemo(
    () => new Map(enrollments.map((enrollment) => [enrollment.courseId, enrollment])),
    [enrollments],
  )

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const skillLevel = profile?.skillLevel?.trim().toLowerCase() || ""

    return [...courses]
      .filter((course) => course.title.toLowerCase().includes(normalizedSearch))
      .sort((left, right) => {
        const leftRecommended = skillLevel && normalizeDifficulty(left.difficulty) === skillLevel
        const rightRecommended = skillLevel && normalizeDifficulty(right.difficulty) === skillLevel

        if (leftRecommended && !rightRecommended) {
          return -1
        }

        if (!leftRecommended && rightRecommended) {
          return 1
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      })
  }, [courses, profile?.skillLevel, search])

  const handleEnroll = async (courseId: number) => {
    if (!authenticated) {
      router.push("/signin")
      return
    }

    try {
      setEnrollingCourseId(courseId)
      const enrollment = await enrollInCourse(courseId)
      setEnrollments((current) => {
        if (current.some((entry) => entry.id === enrollment.id)) {
          return current
        }

        return [...current, enrollment]
      })
      toast.success("Enrollment successful")
      router.push(`/courses/${courseId}`)
    } catch (enrollError) {
      console.error(enrollError)
      toast.error("Unable to enroll right now.")
    } finally {
      setEnrollingCourseId(null)
    }
  }

  if (loading) {
    return (
      <div className="card-ui flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading courses...
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <BookOpen className="text-purple-300" size={24} />
            Courses
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Browse live course data and enroll directly without changing your workflow.
          </p>
          {profile?.skillLevel ? (
            <p className="mt-3 text-sm text-purple-200">
              Recommended for {formatDifficulty(profile.skillLevel)}
            </p>
          ) : null}
        </div>

        <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              className="pl-10"
              placeholder="Search courses..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Button asChild variant="secondary">
            <Link href={authenticated ? "/dashboard" : "/signin"}>
              {authenticated ? "Dashboard" : "Sign In"}
            </Link>
          </Button>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="card-ui text-center text-gray-400">No courses matched your search.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const enrollment = enrollmentMap.get(course.id)
            const progress = clampProgress(enrollment?.progress)
            const progressStatus =
              progress >= 100 ? "completed" : progress > 0 ? "in-progress" : "not-started"
            const isRecommended =
              profile?.skillLevel &&
              normalizeDifficulty(course.difficulty) === profile.skillLevel.trim().toLowerCase()
            const isSubmitting = enrollingCourseId === course.id
            const theme = getCourseCardTheme(course.difficulty)

            return (
              <article
                key={course.id}
                className={`group relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,16,24,0.98),rgba(26,15,46,0.92))] p-6 shadow-[0_18px_45px_rgba(8,6,22,0.34)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_26px_56px_rgba(18,12,38,0.44)] ${
                  isRecommended ? "ring-1 ring-fuchsia-400/20" : ""
                }`}
              >
                <div
                  className={`absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-90 ${theme.accentGlow}`}
                />
                <div className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r ${theme.accentLine}`} />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${theme.badge}`}>
                    {formatDifficulty(course.difficulty)}
                  </span>
                  {isRecommended ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${theme.recommended}`}>
                      Recommended
                    </span>
                  ) : null}
                </div>

                <div className="relative z-10">
                  <h2 className="text-xl font-semibold text-white">{course.title}</h2>
                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    <p>Course ID: {course.id}</p>
                    <p>Published {formatRelativeDate(course.createdAt)}</p>
                  </div>
                </div>

                <div className={`relative z-10 rounded-2xl border p-4 ${theme.meta}`}>
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
                    <span>{getCourseProgressLabel(progressStatus)}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[rgba(9,12,20,0.8)]">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r transition-all duration-300 ${theme.progress}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {enrollment ? (
                  <Link
                    href={`/courses/${course.id}`}
                    className="relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-3 text-sm font-medium text-white shadow-md shadow-fuchsia-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_20px_40px_rgba(217,70,239,0.24)]"
                  >
                    Resume Course
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleEnroll(course.id)}
                    disabled={isSubmitting}
                    className="relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-fuchsia-400/45 hover:bg-gradient-to-r hover:from-violet-500/12 hover:to-fuchsia-500/12 hover:shadow-[0_16px_32px_rgba(139,92,246,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authenticated
                      ? isSubmitting
                        ? "Enrolling..."
                        : "Enroll Now"
                      : "Sign In to Enroll"}
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
