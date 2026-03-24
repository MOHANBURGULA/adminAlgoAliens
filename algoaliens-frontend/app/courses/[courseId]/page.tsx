"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  Lock,
  type LucideIcon,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  UploadCloud,
} from "lucide-react"
import ProgressBar from "@/components/dashboard/ProgressBar"
import { LeaveCourseModal } from "@/components/courses/LeaveCourseModal"
import { isAuthenticated } from "@/lib/auth"
import { getApiErrorMessage, isAxiosStatus } from "@/lib/http"
import {
  FINAL_EVALUATION_TITLE,
  calculateEnrollmentProgress,
  enrollInCourse,
  fetchCourse,
  fetchCourseModules,
  fetchEnrollments,
  fetchEvaluationAttempts,
  fetchFinalQuizAttempts,
  fetchFinalQuizQuestions,
  fetchModuleDocuments,
  fetchModuleProgress,
  fetchModuleQuestions,
  fetchProjects,
  fetchVideos,
  formatDifficulty,
  getFinalEvaluationModule,
  getMainModules,
  submitFinalQuiz,
  submitModuleQuiz,
  type Course,
  type CourseModule,
  type Enrollment,
  type EvaluationAttempt,
  type FinalQuizAttempt,
  type ModuleDocument,
  type ModuleProgress,
  type ProjectSubmission,
  type Question,
  type UserVideo,
  unenrollFromCourse,
  updateEnrollmentProgress,
} from "@/lib/learning"

type LearningModule = CourseModule & {
  isVirtualFinal?: boolean
}

type StageDocuments = {
  activity: ModuleDocument | null
  explanation: ModuleDocument | null
  theory: ModuleDocument | null
}

type StatusTone =
  | "indigo"
  | "emerald"
  | "orange"
  | "purple"
  | "red"
  | "slate"
  | "yellow"

function difficultyTone(difficulty: string) {
  const normalized = difficulty.trim().toLowerCase()
  if (normalized === "advanced") return "border-red-500/30 bg-red-500/10 text-red-100"
  if (normalized === "intermediate") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-100"
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
}

function statusTone(tone: StatusTone) {
  if (tone === "emerald") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
  if (tone === "orange") return "border-orange-500/20 bg-orange-500/10 text-orange-100"
  if (tone === "yellow") return "border-yellow-500/20 bg-yellow-500/10 text-yellow-100"
  if (tone === "red") return "border-red-500/20 bg-red-500/10 text-red-100"
  if (tone === "indigo") return "border-indigo-500/20 bg-indigo-500/10 text-indigo-100"
  if (tone === "purple") return "border-purple-500/20 bg-purple-500/10 text-purple-100"
  return "border-white/10 bg-white/[0.03] text-gray-200"
}

function StageBadge({
  label,
  tone,
}: {
  label: string
  tone: StatusTone
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${statusTone(
        tone,
      )}`}
    >
      {label}
    </span>
  )
}

function StageRow({
  actionDisabled = false,
  actionHref,
  actionLabel,
  badgeLabel,
  badgeTone,
  description,
  icon: Icon,
  onAction,
  title,
}: {
  actionDisabled?: boolean
  actionHref?: string
  actionLabel: string
  badgeLabel: string
  badgeTone: StatusTone
  description: string
  icon: LucideIcon
  onAction?: () => void
  title: string
}) {
  const actionClassName =
    "inline-flex min-w-[110px] items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition"

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#12092A]/70 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#1A0F32] text-indigo-200">
          <Icon size={18} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              {title}
            </h3>
            <StageBadge label={badgeLabel} tone={badgeTone} />
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-300">{description}</p>
        </div>
      </div>

      {actionHref ? (
        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className={`${actionClassName} ${
            actionDisabled
              ? "pointer-events-none border border-white/10 bg-white/[0.03] text-gray-500"
              : "bg-gradient-to-r from-purple-600 to-indigo-700 text-white"
          }`}
        >
          {actionLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className={`${actionClassName} ${
            actionDisabled
              ? "cursor-not-allowed border border-white/10 bg-white/[0.03] text-gray-500"
              : "bg-gradient-to-r from-purple-600 to-indigo-700 text-white"
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function sortByDateDesc<T>(items: T[], key: keyof T) {
  return [...items].sort(
    (left, right) =>
      new Date(String(right[key])).getTime() - new Date(String(left[key])).getTime(),
  )
}

function getLatest<T>(items: T[], key: keyof T) {
  return sortByDateDesc(items, key)[0] || null
}

function buildLearningModules(courseId: number, modules: CourseModule[]) {
  const mainModules = getMainModules(modules)
  const finalModule = getFinalEvaluationModule(modules)

  if (finalModule) {
    return [...mainModules, finalModule]
  }

  return [
    ...mainModules,
    {
      courseId,
      id: courseId * -1,
      isVirtualFinal: true,
      orderIndex: mainModules.length + 1,
      title: FINAL_EVALUATION_TITLE,
    },
  ] satisfies LearningModule[]
}

function bucketDocuments(documents: ModuleDocument[]): StageDocuments {
  const available = [...documents]
  const pickBySuffix = (suffix: string) =>
    available.find((document) => document.label.trim().endsWith(suffix)) || null

  const theory = pickBySuffix(".1") || available[0] || null
  const activity =
    pickBySuffix(".2") ||
    available.find((document) => document.id !== theory?.id) ||
    null
  const explanation =
    pickBySuffix(".3") ||
    available.find(
      (document) => document.id !== theory?.id && document.id !== activity?.id,
    ) ||
    null

  return { activity, explanation, theory }
}

function moduleCardProgress(isCompleted: boolean, isUnlocked: boolean) {
  if (isCompleted) return 100
  if (isUnlocked) return 33
  return 0
}

export default function CoursePage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const courseId = Number(params?.courseId)
  const progressSyncRef = useRef(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<CourseModule[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([])
  const [projects, setProjects] = useState<ProjectSubmission[]>([])
  const [videos, setVideos] = useState<UserVideo[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationAttempt[]>([])
  const [finalQuizAttempts, setFinalQuizAttempts] = useState<FinalQuizAttempt[]>([])
  const [documentsByModule, setDocumentsByModule] = useState<Record<number, ModuleDocument[]>>({})
  const [questionsByModule, setQuestionsByModule] = useState<Record<number, Question[]>>({})
  const [answersByModule, setAnswersByModule] = useState<Record<number, Record<number, number>>>({})
  const [finalQuestions, setFinalQuestions] = useState<Question[]>([])
  const [finalAnswers, setFinalAnswers] = useState<Record<number, number>>({})
  const [loadingModules, setLoadingModules] = useState<Record<number, boolean>>({})
  const [moduleErrors, setModuleErrors] = useState<Record<number, string>>({})
  const [openModuleId, setOpenModuleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [leavingCourse, setLeavingCourse] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [submittingModuleId, setSubmittingModuleId] = useState<number | null>(null)
  const [submittingFinalQuizState, setSubmittingFinalQuizState] = useState(false)

  const hasAuthSession = isAuthenticated()

  const loadCourseState = useCallback(async () => {
    const [
      courseResult,
      modulesResult,
      enrollmentsResult,
      progressResult,
      finalAttemptsResult,
      projectsResult,
      videosResult,
      evaluationsResult,
    ] = await Promise.allSettled([
      fetchCourse(courseId),
      fetchCourseModules(courseId),
      fetchEnrollments(),
      fetchModuleProgress(courseId),
      fetchFinalQuizAttempts(courseId),
      fetchProjects(),
      fetchVideos(),
      fetchEvaluationAttempts(courseId),
    ])

    if (courseResult.status === "rejected") throw courseResult.reason
    if (modulesResult.status === "rejected") throw modulesResult.reason

    const enrollments =
      enrollmentsResult.status === "fulfilled" ? enrollmentsResult.value : []

    setCourse(courseResult.value)
    setModules(modulesResult.value)
    setEnrollment(enrollments.find((entry) => entry.courseId === courseId) || null)
    setModuleProgress(progressResult.status === "fulfilled" ? progressResult.value : [])
    setFinalQuizAttempts(finalAttemptsResult.status === "fulfilled" ? finalAttemptsResult.value : [])
    setProjects(projectsResult.status === "fulfilled" ? projectsResult.value : [])
    setVideos(videosResult.status === "fulfilled" ? videosResult.value : [])
    setEvaluations(evaluationsResult.status === "fulfilled" ? evaluationsResult.value : [])
  }, [courseId])

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setError("Invalid course route.")
      setLoading(false)
      return
    }

    if (!hasAuthSession) {
      router.replace("/signin")
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError("")
        await loadCourseState()
      } catch (loadError) {
        if (cancelled) return

        if (isAxiosStatus(loadError, 404)) {
          setError("Course not found.")
        } else {
          setError(getApiErrorMessage(loadError, "Unable to load this course."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [courseId, hasAuthSession, loadCourseState, router])

  const learningModules = useMemo(
    () => buildLearningModules(courseId, modules),
    [courseId, modules],
  )
  const mainModules = useMemo(
    () => learningModules.filter((module) => module.title !== FINAL_EVALUATION_TITLE),
    [learningModules],
  )
  const finalModule = useMemo(
    () =>
      learningModules.find((module) => module.title === FINAL_EVALUATION_TITLE) ||
      null,
    [learningModules],
  )
  const progressByModuleId = useMemo(
    () => new Map(moduleProgress.map((entry) => [entry.moduleId, entry])),
    [moduleProgress],
  )
  const completedMainModules = useMemo(
    () =>
      mainModules.filter((module) => progressByModuleId.get(module.id)?.completed).length,
    [mainModules, progressByModuleId],
  )
  const latestFinalQuizAttempt = useMemo(
    () => getLatest(finalQuizAttempts, "attemptedAt"),
    [finalQuizAttempts],
  )
  const finalQuizPassed = useMemo(
    () => finalQuizAttempts.some((attempt) => attempt.passed),
    [finalQuizAttempts],
  )
  const courseProjects = useMemo(
    () =>
      sortByDateDesc(
        projects.filter((project) => project.courseId === courseId),
        "createdAt",
      ),
    [courseId, projects],
  )
  const latestProject = useMemo(() => courseProjects[0] || null, [courseProjects])
  const courseEvaluations = useMemo(
    () => sortByDateDesc(evaluations, "createdAt"),
    [evaluations],
  )
  const latestEvaluation = useMemo(
    () => courseEvaluations[0] || null,
    [courseEvaluations],
  )
  const relatedVideo = useMemo(() => {
    if (!latestEvaluation) {
      return null
    }

    return videos.find((video) => video.videoUrl === latestEvaluation.videoKey) || null
  }, [latestEvaluation, videos])
  const hasVideoSubmission = Boolean(latestEvaluation)
  const hasPassedEvaluation = courseEvaluations.some(
    (evaluation) => evaluation.status === "passed",
  )
  const allMainModulesCompleted =
    mainModules.length > 0 && completedMainModules === mainModules.length
  const calculatedProgress = useMemo(
    () =>
      calculateEnrollmentProgress({
        completedMainModules,
        totalMainModules: mainModules.length,
        finalQuizPassed,
        hasProjectSubmission: Boolean(latestProject),
        hasVideoSubmission,
        hasPassedEvaluation,
      }),
    [
      completedMainModules,
      finalQuizPassed,
      hasPassedEvaluation,
      hasVideoSubmission,
      latestProject,
      mainModules.length,
    ],
  )
  const displayedProgress = enrollment
    ? Math.max(enrollment.progress, calculatedProgress)
    : calculatedProgress
  const finalEvaluationProgress = Math.round(
    (((finalQuizPassed ? 1 : 0) + (latestProject ? 1 : 0) + (hasVideoSubmission ? 1 : 0)) /
      3) *
      100,
  )

  useEffect(() => {
    if (!enrollment) {
      return
    }

    if (enrollment.progress === calculatedProgress || progressSyncRef.current) {
      return
    }

    let cancelled = false
    progressSyncRef.current = true

    void updateEnrollmentProgress(enrollment.id, calculatedProgress)
      .then((updatedEnrollment) => {
        if (!cancelled && updatedEnrollment) {
          setEnrollment(updatedEnrollment)
        }
      })
      .catch((syncError) => {
        if (!cancelled) {
          console.error("Progress sync failed", syncError)
        }
      })
      .finally(() => {
        progressSyncRef.current = false
      })

    return () => {
      cancelled = true
    }
  }, [calculatedProgress, enrollment])

  const loadModuleResources = async (module: LearningModule) => {
    if (module.title === FINAL_EVALUATION_TITLE) {
      if (finalQuestions.length > 0 || !allMainModulesCompleted) {
        return
      }

      setLoadingModules((current) => ({ ...current, [module.id]: true }))
      setModuleErrors((current) => ({ ...current, [module.id]: "" }))

      try {
        const questions = await fetchFinalQuizQuestions(courseId)
        setFinalQuestions(questions)
      } catch (moduleError) {
        setModuleErrors((current) => ({
          ...current,
          [module.id]: getApiErrorMessage(
            moduleError,
            "Unable to load the final quiz right now.",
          ),
        }))
      } finally {
        setLoadingModules((current) => ({ ...current, [module.id]: false }))
      }

      return
    }

    if (documentsByModule[module.id] && questionsByModule[module.id]) {
      return
    }

    setLoadingModules((current) => ({ ...current, [module.id]: true }))
    setModuleErrors((current) => ({ ...current, [module.id]: "" }))

    const [documentsResult, questionsResult] = await Promise.allSettled([
      fetchModuleDocuments(courseId, module.id),
      fetchModuleQuestions(courseId, module.id),
    ])

    if (documentsResult.status === "fulfilled") {
      setDocumentsByModule((current) => ({
        ...current,
        [module.id]: documentsResult.value,
      }))
    }

    if (questionsResult.status === "fulfilled") {
      setQuestionsByModule((current) => ({
        ...current,
        [module.id]: questionsResult.value,
      }))
    }

    if (documentsResult.status === "rejected" || questionsResult.status === "rejected") {
      const primaryError =
        documentsResult.status === "rejected"
          ? documentsResult.reason
          : questionsResult.status === "rejected"
            ? questionsResult.reason
            : null

      setModuleErrors((current) => ({
        ...current,
        [module.id]: getApiErrorMessage(
          primaryError,
          "Unable to load the module resources.",
        ),
      }))
    }

    setLoadingModules((current) => ({ ...current, [module.id]: false }))
  }

  const toggleModule = (module: LearningModule, isUnlocked: boolean) => {
    const nextModuleId = openModuleId === module.id ? null : module.id
    setOpenModuleId(nextModuleId)

    if (nextModuleId === module.id && isUnlocked) {
      void loadModuleResources(module)
    }
  }

  const updateModuleAnswer = (
    moduleId: number,
    questionId: number,
    optionIndex: number,
  ) => {
    setAnswersByModule((current) => ({
      ...current,
      [moduleId]: {
        ...(current[moduleId] || {}),
        [questionId]: optionIndex,
      },
    }))
  }

  const handleModuleQuizSubmit = async (moduleId: number) => {
    try {
      setSubmittingModuleId(moduleId)
      const result = await submitModuleQuiz(
        courseId,
        moduleId,
        answersByModule[moduleId] || {},
      )
      toast.success(result.message)
      setAnswersByModule((current) => ({
        ...current,
        [moduleId]: {},
      }))
      await loadCourseState()
    } catch (submitError) {
      toast.error(
        getApiErrorMessage(submitError, "Unable to submit the module quiz."),
      )
    } finally {
      setSubmittingModuleId(null)
    }
  }

  const handleFinalQuizSubmit = async () => {
    try {
      setSubmittingFinalQuizState(true)
      const result = await submitFinalQuiz(courseId, finalAnswers)
      toast.success(result.message)
      setFinalAnswers({})
      setFinalQuestions([])
      await loadCourseState()

      if (finalModule) {
        await loadModuleResources(finalModule)
      }
    } catch (submitError) {
      toast.error(
        getApiErrorMessage(submitError, "Unable to submit the final quiz."),
      )
    } finally {
      setSubmittingFinalQuizState(false)
    }
  }

  const handleEnroll = async () => {
    try {
      setEnrolling(true)
      const nextEnrollment = await enrollInCourse(courseId)
      setEnrollment(nextEnrollment)
      toast.success("Enrollment successful")
      await loadCourseState()
    } catch (enrollError) {
      toast.error(getApiErrorMessage(enrollError, "Unable to enroll right now."))
    } finally {
      setEnrolling(false)
    }
  }

  const handleLeaveCourse = async () => {
    if (!enrollment) {
      return
    }

    try {
      setLeavingCourse(true)
      await unenrollFromCourse(enrollment.id)
      toast.success("You have left this course.")
      router.replace("/courses")
    } catch (leaveError) {
      toast.error(
        getApiErrorMessage(leaveError, "Unable to leave the course right now."),
      )
    } finally {
      setLeavingCourse(false)
      setLeaveModalOpen(false)
    }
  }

  if (!hasAuthSession) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center rounded-[32px] border border-white/10 bg-[#0B0518]/80 p-8 text-center text-gray-300">
        Redirecting you to sign in so we can load the live module progress for this
        course.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-gray-300">
        Loading course experience...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-[#0B0518] p-6 text-gray-300">
        Course not found.
      </div>
    )
  }

  return (
    <>
      <LeaveCourseModal
        busy={leavingCourse}
        courseTitle={course.title}
        open={leaveModalOpen}
        onCancel={() => setLeaveModalOpen(false)}
        onConfirm={() => void handleLeaveCourse()}
      />

      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]"
          >
            <ArrowLeft size={16} />
            All courses
          </Link>

          <div className="flex flex-wrap gap-3">
            {enrollment ? (
              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
              >
                Leave Course
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleEnroll()}
                disabled={enrolling}
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </button>
            )}
          </div>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(11,5,24,0.98),rgba(18,9,42,0.96))] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${difficultyTone(
                  course.difficulty,
                )}`}
              >
                {formatDifficulty(course.difficulty)}
              </span>
              <h1 className="mt-5 flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
                <BookOpen className="text-indigo-300" size={22} />
                {course.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
                Follow the ordered learning path, pass each module checkpoint to
                unlock the next topic, and complete the final evaluation to finish
                your course.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <StageBadge label={`${mainModules.length} learning modules`} tone="purple" />
                <StageBadge label="Final evaluation included" tone="indigo" />
                {!enrollment ? <StageBadge label="Preview mode" tone="orange" /> : null}
              </div>
            </div>

            <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#12092A]/90 p-6">
              <ProgressBar value={displayedProgress} label="Course progress" />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#0B0518] p-4">
                  <p className="text-lg font-semibold text-white">
                    {completedMainModules}/{mainModules.length}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                    Modules
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0B0518] p-4">
                  <p className="text-lg font-semibold text-white">
                    {finalQuizPassed ? "Passed" : "Pending"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                    Final MCQ
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0B0518] p-4">
                  <p className="text-lg font-semibold text-white">
                    {hasPassedEvaluation ? "Passed" : hasVideoSubmission ? "Review" : "Locked"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                    Video Review
                  </p>
                </div>
              </div>

              {enrollment && enrollment.progress !== calculatedProgress ? (
                <p className="mt-4 text-xs text-indigo-200">
                  Syncing updated progress to your enrollment record...
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {learningModules.map((module, index) => {
            const isFinalModule = module.title === FINAL_EVALUATION_TITLE
            const moduleProgressRecord = progressByModuleId.get(module.id)
            const isCompleted = Boolean(moduleProgressRecord?.completed)
            const previousModule = mainModules[index - 1]
            const isUnlocked = isFinalModule
              ? allMainModulesCompleted
              : index === 0
                ? true
                : Boolean(previousModule && progressByModuleId.get(previousModule.id)?.completed)
            const cardProgress = isFinalModule
              ? finalEvaluationProgress
              : moduleCardProgress(isCompleted, isUnlocked)
            const moduleDocuments = documentsByModule[module.id] || []
            const stageDocuments = bucketDocuments(moduleDocuments)
            const moduleQuestions = questionsByModule[module.id] || []
            const isOpen = openModuleId === module.id
            const isLoadingResources = loadingModules[module.id]
            const moduleError = moduleErrors[module.id]

            return (
              <article
                key={module.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(11,5,24,0.96),rgba(18,9,42,0.94))] shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
              >
                <button
                  type="button"
                  onClick={() => toggleModule(module, isUnlocked)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#1A0F32] text-sm font-semibold text-indigo-100">
                      {module.orderIndex}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-white">{module.title}</h2>
                        <StageBadge
                          label={
                            isFinalModule
                              ? hasPassedEvaluation
                                ? "Completed"
                                : hasVideoSubmission || latestProject || finalQuizPassed
                                  ? "In Progress"
                                  : isUnlocked
                                    ? "Ready"
                                    : "Locked"
                              : isCompleted
                                ? "Completed"
                                : isUnlocked
                                  ? "In Progress"
                                  : "Locked"
                          }
                          tone={
                            isFinalModule
                              ? hasPassedEvaluation
                                ? "emerald"
                                : hasVideoSubmission || latestProject || finalQuizPassed
                                  ? "indigo"
                                  : isUnlocked
                                    ? "purple"
                                    : "slate"
                              : isCompleted
                                ? "emerald"
                                : isUnlocked
                                  ? "purple"
                                  : "slate"
                          }
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span>3 stages</span>
                        <span>{cardProgress}% complete</span>
                        {!isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-orange-200">
                            <Lock size={14} />
                            Finish the previous module first
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="text-gray-400" size={18} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={18} />
                  )}
                </button>

                {isOpen ? (
                  <div className="border-t border-white/10 px-5 pb-5 pt-4">
                    {!isUnlocked ? (
                      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-100">
                        {isFinalModule
                          ? "Complete all five learning modules to unlock the final MCQ test."
                          : "This module stays locked until the previous module quiz is passed."}
                      </div>
                    ) : isLoadingResources ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
                        Loading module content...
                      </div>
                    ) : moduleError ? (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                        {moduleError}
                      </div>
                    ) : isFinalModule ? (
                      <div className="space-y-4">
                        <StageRow
                          actionLabel={finalQuizPassed ? "Review" : "Start Test"}
                          badgeLabel={
                            finalQuizPassed
                              ? "Completed"
                              : latestFinalQuizAttempt
                                ? "In Progress"
                                : "Ready"
                          }
                          badgeTone={
                            finalQuizPassed
                              ? "emerald"
                              : latestFinalQuizAttempt
                                ? "orange"
                                : "purple"
                          }
                          description={
                            latestFinalQuizAttempt
                              ? `Latest score: ${latestFinalQuizAttempt.score}%. Reach 80% to unlock project submission and video upload.`
                              : "Pass the final MCQ test with at least 80% to unlock the remaining evaluation steps."
                          }
                          icon={ShieldCheck}
                          onAction={() => {
                            const element = document.getElementById("final-quiz-section")
                            element?.scrollIntoView({ behavior: "smooth", block: "start" })
                          }}
                          title="Final MCQ Test"
                        />

                        <StageRow
                          actionDisabled={!finalQuizPassed}
                          actionLabel={latestProject ? "Review" : "Submit"}
                          badgeLabel={
                            latestProject
                              ? latestProject.status === "approved"
                                ? "Approved"
                                : latestProject.status === "rejected"
                                  ? "Rejected"
                                  : "Submitted"
                              : finalQuizPassed
                                ? "Ready"
                                : "Locked"
                          }
                          badgeTone={
                            latestProject
                              ? latestProject.status === "approved"
                                ? "emerald"
                                : latestProject.status === "rejected"
                                  ? "red"
                                  : "yellow"
                              : finalQuizPassed
                                ? "purple"
                                : "slate"
                          }
                          description={
                            latestProject
                              ? `Latest project status: ${latestProject.status}. ${
                                  latestProject.feedback || "Waiting for admin review."
                                }`
                              : "Submit your project ZIP or GitHub repository after the final MCQ test is passed."
                          }
                          icon={Trophy}
                          onAction={() => router.push(`/projects?courseId=${courseId}`)}
                          title="Submit Project"
                        />

                        <StageRow
                          actionDisabled={!finalQuizPassed}
                          actionLabel={hasVideoSubmission ? "Continue" : "Upload"}
                          badgeLabel={
                            hasPassedEvaluation
                              ? "Approved"
                              : hasVideoSubmission
                                ? "Under Review"
                                : finalQuizPassed
                                  ? "Ready"
                                  : "Locked"
                          }
                          badgeTone={
                            hasPassedEvaluation
                              ? "emerald"
                              : hasVideoSubmission
                                ? "yellow"
                                : finalQuizPassed
                                  ? "indigo"
                                  : "slate"
                          }
                          description={
                            latestEvaluation
                              ? `Latest evaluation: ${latestEvaluation.status}. ${
                                  latestEvaluation.feedback || "Analysis is still processing."
                                }`
                              : relatedVideo
                                ? `Latest upload: ${relatedVideo.title}. Submit it for evaluation after your final MCQ pass.`
                                : "Upload your explanation video after the final MCQ test is passed."
                          }
                          icon={UploadCloud}
                          onAction={() => router.push(`/upload?courseId=${courseId}`)}
                          title="Upload Explanation Video"
                        />

                        <section
                          id="final-quiz-section"
                          className="rounded-[24px] border border-white/10 bg-[#12092A]/80 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">Final Quiz</h3>
                              <p className="mt-1 text-sm text-gray-300">
                                Passing score: 80%. Retries are allowed until you
                                clear the threshold.
                              </p>
                            </div>
                            <StageBadge
                              label={
                                finalQuizPassed
                                  ? "Passed"
                                  : latestFinalQuizAttempt
                                    ? `${latestFinalQuizAttempt.score}%`
                                    : "Not Started"
                              }
                              tone={finalQuizPassed ? "emerald" : "orange"}
                            />
                          </div>

                          {finalQuestions.length === 0 ? (
                            <p className="mt-5 rounded-2xl border border-white/10 bg-[#0B0518] p-4 text-sm text-gray-300">
                              Final quiz questions will appear here as soon as the
                              backend returns them for this course.
                            </p>
                          ) : (
                            <div className="mt-5 space-y-4">
                              {finalQuestions.map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-2xl border border-white/10 bg-[#0B0518] p-4"
                                >
                                  <p className="font-medium text-white">{question.questionText}</p>
                                  <div className="mt-4 space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <label
                                        key={`${question.id}-${optionIndex}`}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-gray-200 transition hover:bg-white/[0.05]"
                                      >
                                        <input
                                          type="radio"
                                          name={`final-${question.id}`}
                                          checked={finalAnswers[question.id] === optionIndex}
                                          onChange={() =>
                                            setFinalAnswers((current) => ({
                                              ...current,
                                              [question.id]: optionIndex,
                                            }))
                                          }
                                        />
                                        {option}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void handleFinalQuizSubmit()}
                              disabled={finalQuestions.length === 0 || submittingFinalQuizState}
                              className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingFinalQuizState
                                ? "Submitting..."
                                : finalQuizPassed
                                  ? "Retake Final Quiz"
                                  : "Submit Final Quiz"}
                            </button>
                            {latestFinalQuizAttempt ? (
                              <p className="text-sm text-gray-300">
                                Latest attempt: {latestFinalQuizAttempt.score}% on{" "}
                                {new Date(latestFinalQuizAttempt.attemptedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            ) : null}
                          </div>
                        </section>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <StageRow
                          actionDisabled={!Boolean(stageDocuments.theory)}
                          actionHref={stageDocuments.theory?.fileUrl}
                          actionLabel={isCompleted ? "Review" : "Open"}
                          badgeLabel={isCompleted ? "Completed" : "In Progress"}
                          badgeTone={isCompleted ? "emerald" : "purple"}
                          description={
                            stageDocuments.theory?.title ||
                            "Open the theory resource for this topic."
                          }
                          icon={BookOpen}
                          title="Theory"
                        />

                        <StageRow
                          actionLabel={isCompleted ? "Review" : "Continue"}
                          badgeLabel={isCompleted ? "Completed" : "In Progress"}
                          badgeTone={isCompleted ? "emerald" : "orange"}
                          description={
                            moduleQuestions.length > 0
                              ? `${moduleQuestions.length} checkpoint questions are ready below.`
                              : stageDocuments.activity?.title ||
                                "Complete the module quiz below to unlock the next module."
                          }
                          icon={Code2}
                          onAction={() => {
                            const element = document.getElementById(`quiz-section-${module.id}`)
                            element?.scrollIntoView({ behavior: "smooth", block: "start" })
                          }}
                          title="Activity"
                        />
                        <StageRow
                          actionDisabled={!Boolean(stageDocuments.explanation)}
                          actionHref={stageDocuments.explanation?.fileUrl}
                          actionLabel={isCompleted ? "Review" : "Continue"}
                          badgeLabel={isCompleted ? "Completed" : "In Progress"}
                          badgeTone={isCompleted ? "emerald" : "indigo"}
                          description={
                            stageDocuments.explanation?.title ||
                            "Review the explanation resource for this module."
                          }
                          icon={PlayCircle}
                          title="Explanation Video"
                        />

                        <section
                          id={`quiz-section-${module.id}`}
                          className="rounded-[24px] border border-white/10 bg-[#12092A]/80 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                Module Checkpoint
                              </h3>
                              <p className="mt-1 text-sm text-gray-300">
                                Pass the quiz with 60% or more to mark this module
                                complete and unlock the next one.
                              </p>
                            </div>
                            <StageBadge
                              label={
                                isCompleted
                                  ? `Passed ${moduleProgressRecord?.quizScore || 0}%`
                                  : "Pending"
                              }
                              tone={isCompleted ? "emerald" : "orange"}
                            />
                          </div>

                          {moduleQuestions.length === 0 ? (
                            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-[#0B0518] p-4 text-sm text-gray-300">
                              No quiz questions are available for this module yet.
                            </div>
                          ) : (
                            <div className="mt-5 space-y-4">
                              {moduleQuestions.map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-2xl border border-white/10 bg-[#0B0518] p-4"
                                >
                                  <p className="font-medium text-white">{question.questionText}</p>
                                  <div className="mt-4 space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <label
                                        key={`${module.id}-${question.id}-${optionIndex}`}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-gray-200 transition hover:bg-white/[0.05]"
                                      >
                                        <input
                                          type="radio"
                                          name={`${module.id}-${question.id}`}
                                          checked={
                                            answersByModule[module.id]?.[question.id] ===
                                            optionIndex
                                          }
                                          onChange={() =>
                                            updateModuleAnswer(
                                              module.id,
                                              question.id,
                                              optionIndex,
                                            )
                                          }
                                        />
                                        {option}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void handleModuleQuizSubmit(module.id)}
                              disabled={
                                moduleQuestions.length === 0 ||
                                submittingModuleId === module.id
                              }
                              className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingModuleId === module.id
                                ? "Submitting..."
                                : isCompleted
                                  ? "Retake Module Quiz"
                                  : "Submit Module Quiz"}
                            </button>
                            {moduleProgressRecord?.completedAt ? (
                              <p className="text-sm text-gray-300">
                                Completed on{" "}
                                {new Date(moduleProgressRecord.completedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            ) : null}
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#0B0518]/90 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Evaluation Snapshot</h2>
              <p className="mt-2 text-sm text-gray-300">
                Your project and explanation video stay linked to the final
                evaluation flow for this course.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StageBadge
                label={latestProject ? latestProject.status : "Project Pending"}
                tone={
                  latestProject
                    ? latestProject.status === "approved"
                      ? "emerald"
                      : latestProject.status === "rejected"
                        ? "red"
                        : "yellow"
                    : "slate"
                }
              />
              <StageBadge
                label={
                  hasPassedEvaluation
                    ? "Video Approved"
                    : hasVideoSubmission
                      ? "Under Review"
                      : "Video Pending"
                }
                tone={hasPassedEvaluation ? "emerald" : hasVideoSubmission ? "yellow" : "slate"}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#12092A] p-5">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-300" size={18} />
                <h3 className="font-semibold text-white">Latest Project</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                {latestProject
                  ? latestProject.description
                  : "No project has been submitted for this course yet."}
              </p>
              {latestProject ? (
                <p className="mt-4 text-sm text-gray-400">
                  GitHub: {latestProject.githubLink}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12092A] p-5">
              <div className="flex items-center gap-3">
                <Sparkles className="text-purple-300" size={18} />
                <h3 className="font-semibold text-white">Latest Video Review</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                {latestEvaluation
                  ? latestEvaluation.feedback || "Evaluation is still processing."
                  : "Upload your explanation video after passing the final quiz."}
              </p>
              {relatedVideo ? (
                <p className="mt-4 text-sm text-gray-400">Video: {relatedVideo.title}</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
