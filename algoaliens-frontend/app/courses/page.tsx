"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  ArrowRight,
  BookOpen,
  LogIn,
  Search,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isAuthenticated } from "@/lib/auth"
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

function getDifficultyVariant(difficulty: string) {
  const normalized = normalizeDifficulty(difficulty)

  if (normalized === "advanced") {
    return "advanced" as const
  }

  if (normalized === "intermediate") {
    return "intermediate" as const
  }

  return "beginner" as const
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)

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

        if (!isAuthenticated()) {
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

        setEnrollments(
          enrollmentResult.status === "fulfilled" ? enrollmentResult.value : [],
        )
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
  }, [])

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
    if (!isAuthenticated()) {
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
      <div className="flex min-h-[55vh] items-center justify-center px-6 text-slate-300">
        Loading course catalog...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="surface-panel flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">AlgoAliens</p>
              <p className="truncate text-xl font-semibold text-white">Public course catalog</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.skillLevel ? (
              <Badge variant="info">Recommended for {formatDifficulty(profile.skillLevel)}</Badge>
            ) : (
              <Badge variant="outline">No auth required</Badge>
            )}

            <Button asChild variant="secondary">
              <Link href={isAuthenticated() ? "/dashboard" : "/signin"}>
                {isAuthenticated() ? "Dashboard" : "Sign in"}
                <LogIn size={16} />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-panel p-8">
            <Badge variant="info" className="gap-2">
              <Sparkles size={12} />
              Live backend catalog
            </Badge>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Explore production-ready courses before you sign in.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Browse every public course, compare difficulty levels, and jump into the learning
              flow the moment you enroll. Recommendations stay aligned with the signed-in user
              profile when available.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Badge variant="beginner">Beginner paths</Badge>
              <Badge variant="intermediate">Intermediate challenges</Badge>
              <Badge variant="advanced">Advanced mastery</Badge>
            </div>
          </div>

          <div className="surface-panel p-6">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses by title"
                className="pl-11"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="surface-stat">
                <p className="text-2xl font-semibold text-white">{courses.length}</p>
                <p className="mt-1 text-sm text-slate-400">Courses available</p>
              </div>
              <div className="surface-stat">
                <p className="text-2xl font-semibold text-white">{enrollments.length}</p>
                <p className="mt-1 text-sm text-slate-400">Your enrollments</p>
              </div>
              <div className="surface-stat">
                <p className="truncate text-2xl font-semibold text-white">
                  {profile?.skillLevel ? formatDifficulty(profile.skillLevel) : "Any"}
                </p>
                <p className="mt-1 text-sm text-slate-400">Recommended level</p>
              </div>
            </div>
          </div>
        </section>

        {filteredCourses.length === 0 ? (
          <div className="surface-panel p-8 text-center text-slate-300">
            No courses matched your search.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const enrollment = enrollmentMap.get(course.id)
              const isRecommended =
                profile?.skillLevel &&
                normalizeDifficulty(course.difficulty) ===
                  profile.skillLevel.trim().toLowerCase()
              const isSubmitting = enrollingCourseId === course.id

              return (
                <article
                  key={course.id}
                  className={`surface-card flex h-full flex-col p-5 ${
                    isRecommended
                      ? "border-cyan-500/25 bg-[linear-gradient(180deg,rgba(8,32,44,0.98),rgba(11,15,26,0.96))]"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant={getDifficultyVariant(course.difficulty)}>
                      {formatDifficulty(course.difficulty)}
                    </Badge>

                    {enrollment ? (
                      <Badge variant="secondary">{enrollment.progress}% complete</Badge>
                    ) : null}
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="line-clamp-2 text-2xl font-semibold leading-tight text-white">
                        {course.title}
                      </h2>
                      {isRecommended ? <Badge variant="info">Recommended</Badge> : null}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">
                      Structured learning modules, guided progression, and live backend-powered
                      evaluations designed for a smoother production learning experience.
                    </p>
                  </div>

                  <div className="surface-stat mt-6 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Published</span>
                    <span className="truncate text-sm text-slate-400">
                      {formatRelativeDate(course.createdAt)}
                    </span>
                  </div>

                  <div className="mt-auto grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2">
                    {enrollment ? (
                      <Button asChild variant="primary" className="w-full">
                        <Link href={`/courses/${course.id}`}>
                          Open course
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        className="w-full"
                        onClick={() => void handleEnroll(course.id)}
                        disabled={isSubmitting}
                      >
                        {isAuthenticated()
                          ? isSubmitting
                            ? "Enrolling..."
                            : "Enroll now"
                          : "Sign in to enroll"}
                        <ArrowRight size={16} />
                      </Button>
                    )}

                    <Button asChild variant="secondary" className="w-full">
                      <Link href={isAuthenticated() ? `/courses/${course.id}` : "/signin"}>
                        {enrollment ? "Resume" : isAuthenticated() ? "Preview" : "Sign in"}
                      </Link>
                    </Button>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
