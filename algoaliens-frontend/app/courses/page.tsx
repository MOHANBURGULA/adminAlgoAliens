"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import CourseCard from "@/components/courses/CourseCard"
import { Input } from "@/components/ui/input"
import { Layers3, Search, SlidersHorizontal, Sparkles } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import {
  enrollInCourse,
  fetchCourseModules,
  fetchCourses,
  fetchEnrollments,
  fetchUserProfile,
  formatDifficulty,
  normalizeDifficulty,
  type Course,
  type CourseModule,
  type Enrollment,
  type UserProfile,
} from "@/lib/learning"
import { formatCompactNumber, getCourseCatalogMetadata } from "@/lib/course-catalog"

type ModulesByCourse = Record<number, CourseModule[]>

export default function CoursesPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [modulesByCourse, setModulesByCourse] = useState<ModulesByCourse>({})
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
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
        const moduleResults = await Promise.allSettled(
          publicCourses.map((course) => fetchCourseModules(course.id)),
        )

        if (cancelled) {
          return
        }

        setCourses(publicCourses)
        setModulesByCourse(
          publicCourses.reduce<ModulesByCourse>((accumulator, course, index) => {
            accumulator[course.id] =
              moduleResults[index]?.status === "fulfilled" ? moduleResults[index].value : []
            return accumulator
          }, {}),
        )

        if (!authenticated) {
          setEnrollments([])
          setProfile(null)
          return
        }

        const [enrollmentsResult, profileResult] = await Promise.allSettled([
          fetchEnrollments(),
          fetchUserProfile(),
        ])

        if (cancelled) {
          return
        }

        setEnrollments(enrollmentsResult.status === "fulfilled" ? enrollmentsResult.value : [])
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

  const categories = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => getCourseCatalogMetadata(course).category))).sort(),
    [courses],
  )

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const skillLevel = profile?.skillLevel?.trim().toLowerCase() || ""

    return [...courses]
      .filter((course) => {
        const metadata = getCourseCatalogMetadata(course)
        const matchesSearch =
          !normalizedSearch ||
          course.title.toLowerCase().includes(normalizedSearch) ||
          metadata.shortDescription.toLowerCase().includes(normalizedSearch) ||
          metadata.category.toLowerCase().includes(normalizedSearch)
        const matchesDifficulty =
          difficultyFilter === "all" ||
          normalizeDifficulty(course.difficulty) === difficultyFilter
        const matchesCategory =
          categoryFilter === "all" || metadata.category === categoryFilter

        return matchesSearch && matchesDifficulty && matchesCategory
      })
      .sort((left, right) => {
        const leftMeta = getCourseCatalogMetadata(left)
        const rightMeta = getCourseCatalogMetadata(right)
        const leftRecommended = skillLevel && normalizeDifficulty(left.difficulty) === skillLevel
        const rightRecommended = skillLevel && normalizeDifficulty(right.difficulty) === skillLevel

        if (leftRecommended && !rightRecommended) {
          return -1
        }

        if (!leftRecommended && rightRecommended) {
          return 1
        }

        return rightMeta.rating - leftMeta.rating
      })
  }, [categoryFilter, courses, difficultyFilter, profile?.skillLevel, search])

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
      router.push(`/courses/${courseId}/learn`)
    } catch (enrollError) {
      console.error(enrollError)
      toast.error("Unable to enroll right now.")
    } finally {
      setEnrollingCourseId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-theme-muted">Course catalog</p>
            <h1 className="text-3xl font-bold leading-tight text-theme-main md:text-[2.7rem]">
              Discover courses built for real-world learning outcomes.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-theme-muted">
              Explore AlgoAliens programs, compare instructors and course depth, and jump straight
              into the paths that match your learning goals.
            </p>
            {profile?.skillLevel ? (
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-theme-main"
                style={{ borderColor: "var(--border-color)" }}
              >
                <Sparkles size={15} className="text-[var(--accent-cyan)]" />
                Recommended for your current level:
                <span className="font-semibold">{formatDifficulty(profile.skillLevel)}</span>
              </div>
            ) : null}
          </div>

          <div
            className="grid gap-3 p-4 md:grid-cols-3 md:p-5"
            style={{
              border: "var(--card-border)",
              borderRadius: "calc(var(--card-radius) + 0.85rem)",
              background: "var(--panel-background)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="rounded-[calc(var(--card-radius)+0.25rem)] border p-4"
              style={{ borderColor: "var(--border-color)", background: "var(--subsurface-background)" }}
            >
              <div className="flex items-center gap-2 text-theme-muted">
                <Layers3 size={15} />
                <p className="text-sm">Courses available</p>
              </div>
              <p className="mt-3 text-2xl font-bold text-theme-main">{courses.length}</p>
            </div>
            <div
              className="rounded-[calc(var(--card-radius)+0.25rem)] border p-4"
              style={{ borderColor: "var(--border-color)", background: "var(--subsurface-background)" }}
            >
              <div className="flex items-center gap-2 text-theme-muted">
                <SlidersHorizontal size={15} />
                <p className="text-sm">Categories</p>
              </div>
              <p className="mt-3 text-2xl font-bold text-theme-main">{categories.length}</p>
            </div>
            <div
              className="rounded-[calc(var(--card-radius)+0.25rem)] border p-4"
              style={{ borderColor: "var(--border-color)", background: "var(--subsurface-background)" }}
            >
              <div className="flex items-center gap-2 text-theme-muted">
                <Sparkles size={15} />
                <p className="text-sm">Matching now</p>
              </div>
              <p className="mt-3 text-2xl font-bold text-theme-main">{filteredCourses.length}</p>
            </div>
          </div>
        </section>

        <section
          className="space-y-4 p-4 md:p-5"
          style={{
            border: "var(--card-border)",
            borderRadius: "calc(var(--card-radius) + 0.85rem)",
            background: "var(--panel-background)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-theme-main">Search and filter</h2>
            <p className="text-sm leading-6 text-theme-muted">
              Narrow the catalog by keyword, difficulty, or category before opening the full
              course overview.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.4fr_0.4fr]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-11"
                placeholder="Search by course title, category, or preview"
              />
            </div>

            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className="input-ui h-12 px-4 text-sm"
            >
              <option value="all">All difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="input-ui h-12 px-4 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="theme-empty-state flex min-h-[40vh] items-center justify-center p-6 text-sm">
            Loading courses...
          </div>
        ) : error ? (
          <div className="rounded-[calc(var(--card-radius)+0.5rem)] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
            {error}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="theme-empty-state p-8 text-center">
            No courses matched your current search and filters.
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredCourses.map((course) => {
              const metadata = getCourseCatalogMetadata(course)
              const enrollment = enrollmentMap.get(course.id)
              const moduleCount = modulesByCourse[course.id]?.length || 0
              const recommended =
                profile?.skillLevel &&
                normalizeDifficulty(course.difficulty) === profile.skillLevel.trim().toLowerCase()

              return (
                <CourseCard
                  key={course.id}
                  category={metadata.category}
                  courseId={course.id}
                  description={metadata.shortDescription}
                  difficulty={formatDifficulty(course.difficulty)}
                  durationLabel={metadata.durationLabel}
                  enrolledStudentsLabel={`${formatCompactNumber(metadata.students)} learners`}
                  instructorName={metadata.instructor.name}
                  moduleCount={moduleCount}
                  primaryAction={
                    enrollment
                      ? {
                          href: `/courses/${course.id}/learn`,
                          label: "Continue Learning",
                        }
                      : {
                          label: authenticated ? "Enroll Now" : "Sign In to Enroll",
                          loading: enrollingCourseId === course.id,
                          onClick: () => void handleEnroll(course.id),
                        }
                  }
                  progress={typeof enrollment?.progress === "number" ? Math.round(enrollment.progress) : undefined}
                  rating={metadata.rating}
                  recommended={Boolean(recommended)}
                  reviewCount={metadata.reviewCount}
                  secondaryAction={{
                    href: `/courses/${course.id}`,
                    label: "View Details",
                  }}
                  title={course.title}
                />
              )
            })}
          </section>
        )}

        <div className="flex justify-between gap-4 rounded-[calc(var(--card-radius)+0.85rem)] border px-5 py-4 text-sm text-theme-muted" style={{ borderColor: "var(--border-color)" }}>
          <span>Use the catalog to compare tracks, course depth, and the best next step for your current level.</span>
          {!authenticated ? <Link href="/signin" className="theme-link-muted font-medium">Sign in to start learning</Link> : null}
        </div>
    </div>
  )
}
