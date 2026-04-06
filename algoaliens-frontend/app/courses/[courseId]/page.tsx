"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import CourseContentAccordion from "@/components/courses/CourseContentAccordion"
import CourseHero from "@/components/courses/CourseHero"
import PublicNavbar from "@/components/layout/PublicNavbar"
import {
  ArrowLeft,
  CheckCircle2,
} from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import {
  buildCourseModulePreview,
  estimateTotalLessons,
  getCourseCatalogMetadata,
} from "@/lib/course-catalog"
import { getApiErrorMessage, isAxiosStatus } from "@/lib/http"
import {
  enrollInCourse,
  fetchCourse,
  fetchCourseModules,
  fetchEnrollments,
  formatDifficulty,
  type Course,
  type CourseModule,
  type Enrollment,
} from "@/lib/learning"

function SectionShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode
  description?: string
  eyebrow?: string
  title: string
}) {
  return (
    <section className="theme-card space-y-6 p-6 md:p-8">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.24em] text-theme-muted">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold leading-tight text-theme-main">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-theme-muted">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  )
}

function BulletList({
  icon: Icon,
  items,
}: {
  icon: typeof CheckCircle2
  items: string[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item}
          className="theme-subcard flex items-start gap-3 p-4"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full theme-chip">
            <Icon size={18} />
          </span>
          <p className="text-sm leading-7 text-theme-main">{item}</p>
        </div>
      ))}
    </div>
  )
}

export default function CourseOverviewPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const courseId = Number(params?.courseId)

  const [authenticated, setAuthenticated] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<CourseModule[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
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
    if (!Number.isFinite(courseId)) {
      setError("Invalid course route.")
      setLoading(false)
      return
    }

    let cancelled = false

    const loadCourseOverview = async () => {
      try {
        setLoading(true)
        setError("")

        const requests = await Promise.allSettled([
          fetchCourse(courseId),
          fetchCourseModules(courseId),
          authenticated ? fetchEnrollments() : Promise.resolve([] as Enrollment[]),
        ])

        const [courseResult, modulesResult, enrollmentsResult] = requests

        if (courseResult.status === "rejected") {
          throw courseResult.reason
        }

        if (modulesResult.status === "rejected") {
          throw modulesResult.reason
        }

        if (cancelled) {
          return
        }

        setCourse(courseResult.value)
        setModules(modulesResult.value)
        setEnrollments(
          enrollmentsResult.status === "fulfilled" ? enrollmentsResult.value : [],
        )
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (isAxiosStatus(loadError, 404)) {
          setError("Course not found.")
        } else {
          setError(getApiErrorMessage(loadError, "Unable to load this course overview."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCourseOverview()

    return () => {
      cancelled = true
    }
  }, [authenticated, courseId])

  const enrollmentMap = useMemo(
    () => new Map(enrollments.map((enrollment) => [enrollment.courseId, enrollment])),
    [enrollments],
  )

  const currentEnrollment = course ? enrollmentMap.get(course.id) || null : null
  const metadata = course ? getCourseCatalogMetadata(course) : null
  const modulePreview = useMemo(
    () => buildCourseModulePreview(modules, Boolean(currentEnrollment)),
    [currentEnrollment, modules],
  )

  const handleEnroll = async (targetCourseId: number) => {
    if (!authenticated) {
      router.push("/signin")
      return
    }

    try {
      setEnrollingCourseId(targetCourseId)
      const enrollment = await enrollInCourse(targetCourseId)

      setEnrollments((current) => {
        if (current.some((entry) => entry.id === enrollment.id)) {
          return current
        }

        return [...current, enrollment]
      })

      toast.success("Enrollment successful")
      router.push(`/courses/${targetCourseId}/learn`)
    } catch (enrollError) {
      toast.error(getApiErrorMessage(enrollError, "Unable to enroll right now."))
    } finally {
      setEnrollingCourseId(null)
    }
  }

  if (loading) {
    return (
      <div className="landing-shell min-h-screen">
        <PublicNavbar />
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6 py-8 text-sm text-theme-muted md:px-8">
          Loading course overview...
        </div>
      </div>
    )
  }

  if (error || !course || !metadata) {
    return (
      <div className="landing-shell min-h-screen">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
          <div className="theme-card space-y-4 p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-theme-muted">Courses</p>
            <h1 className="text-4xl font-bold leading-tight text-theme-main">
              We could not open this course.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-theme-muted">
              {error || "This course overview is unavailable right now."}
            </p>
            <div className="pt-2">
              <Link href="/courses" className="theme-outline-link px-4 py-2 text-sm font-medium">
                Back to courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalLessons = estimateTotalLessons(modules)
  return (
    <div className="landing-shell min-h-screen">
      <PublicNavbar />

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/courses"
            className="theme-outline-link inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to courses
          </Link>
        </div>

        <CourseHero
          category={metadata.category}
          description={metadata.description}
          difficultyLabel={formatDifficulty(course.difficulty)}
          durationLabel={metadata.durationLabel}
          moduleCount={modules.length}
          primaryAction={
            currentEnrollment
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
          subtitle={metadata.subtitle}
          title={course.title}
        />

        <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionShell
            eyebrow="Learning outcomes"
            title="What you&apos;ll learn"
            description="Each module builds toward practical confidence, not just theory recall."
          >
            <BulletList icon={CheckCircle2} items={metadata.learningOutcomes} />
          </SectionShell>

          <SectionShell
            eyebrow="At a glance"
            title="Course snapshot"
            description="A quick summary of the structure, pace, and learner fit before you enroll."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="theme-subcard p-4">
                <p className="text-sm text-theme-muted">Modules</p>
                <p className="mt-2 text-lg font-semibold text-theme-main">{modules.length}</p>
              </div>
              <div className="theme-subcard p-4">
                <p className="text-sm text-theme-muted">Lessons</p>
                <p className="mt-2 text-lg font-semibold text-theme-main">{totalLessons}</p>
              </div>
              <div className="theme-subcard p-4">
                <p className="text-sm text-theme-muted">Difficulty</p>
                <p className="mt-2 text-lg font-semibold text-theme-main">
                  {formatDifficulty(course.difficulty)}
                </p>
              </div>
            </div>
          </SectionShell>
        </section>

        <SectionShell
          eyebrow="Course content"
          title="Structured modules and lessons"
          description="Explore the curriculum the same way learners do, with clear module grouping and locked indicators for post-enrollment lessons."
        >
          <CourseContentAccordion sections={modulePreview} />
        </SectionShell>
      </div>
    </div>
  )
}
