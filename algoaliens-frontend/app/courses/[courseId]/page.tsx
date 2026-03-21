"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"
import { Book, BookOpen, ChevronDown, ChevronUp, Code2, Video } from "lucide-react"
import { apiClient } from "@/lib/axios"

type Course = {
  id: number
  title: string
  difficulty: string
}

type CourseModule = {
  id: number
  title: string
  orderIndex: number
}

type Enrollment = {
  id: number
  courseId: number
  progress: number
}

type ModuleProgress = {
  moduleId: number
  completed: boolean
  quizScore: number
}

type ModuleDocument = {
  id: number
  label: string
  title: string
  fileUrl: string
}

type Question = {
  id: number
  questionText: string
  options: string[]
}

export default function CoursePage() {
  const params = useParams<{ courseId: string }>()
  const courseId = Number(params.courseId)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<CourseModule[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<ModuleProgress[]>([])
  const [documents, setDocuments] = useState<Record<number, ModuleDocument[]>>({})
  const [questions, setQuestions] = useState<Record<number, Question[]>>({})
  const [answers, setAnswers] = useState<Record<number, Record<number, number>>>({})
  const [finalQuestions, setFinalQuestions] = useState<Question[]>([])
  const [finalAnswers, setFinalAnswers] = useState<Record<number, number>>({})
  const [openModuleId, setOpenModuleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingModuleId, setSubmittingModuleId] = useState<number | null>(null)

  const loadCourse = async () => {
    const [courseRes, modulesRes, progressRes, enrollmentsRes] = await Promise.all([
      apiClient.get(`/api/courses/${courseId}`),
      apiClient.get(`/api/courses/${courseId}/modules`),
      apiClient.get(`/api/courses/${courseId}/modules/progress`),
      apiClient.get("/api/enroll"),
    ])

    setCourse(courseRes.data as Course)
    setModules(modulesRes.data as CourseModule[])
    setProgress(progressRes.data as ModuleProgress[])
    setEnrollment(
      (enrollmentsRes.data as Enrollment[]).find((entry) => entry.courseId === courseId) || null,
    )
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await loadCourse()
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.response?.data?.message || "Unable to load course.")
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
  }, [courseId])

  const loadModuleContent = async (module: CourseModule) => {
    if (!documents[module.id]) {
      const docsRes = await apiClient.get(`/api/courses/${courseId}/modules/${module.id}/documents`)
      setDocuments((current) => ({
        ...current,
        [module.id]: docsRes.data as ModuleDocument[],
      }))
    }

    if (module.title === "Final Evaluation") {
      if (finalQuestions.length === 0) {
        const finalRes = await apiClient.get(`/api/courses/${courseId}/final-quiz/questions`)
        setFinalQuestions(finalRes.data as Question[])
      }

      return
    }

    if (!questions[module.id]) {
      const questionsRes = await apiClient.get(`/api/courses/${courseId}/modules/${module.id}/questions`)
      setQuestions((current) => ({
        ...current,
        [module.id]: questionsRes.data as Question[],
      }))
    }
  }

  const toggleModule = async (module: CourseModule) => {
    const nextOpen = openModuleId === module.id ? null : module.id
    setOpenModuleId(nextOpen)

    if (nextOpen === module.id) {
      try {
        await loadModuleContent(module)
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unable to load module content.")
      }
    }
  }

  const completedModuleIds = new Set(
    progress.filter((entry) => entry.completed).map((entry) => entry.moduleId),
  )

  const highestUnlockedOrder = Math.min(modules.length, completedModuleIds.size + 1)

  const updateModuleAnswer = (moduleId: number, questionId: number, optionIndex: number) => {
    setAnswers((current) => ({
      ...current,
      [moduleId]: {
        ...(current[moduleId] || {}),
        [questionId]: optionIndex,
      },
    }))
  }

  const submitModuleQuiz = async (moduleId: number) => {
    try {
      setSubmittingModuleId(moduleId)
      await apiClient.post(`/api/courses/${courseId}/modules/${moduleId}/quiz/submit`, {
        answers: answers[moduleId] || {},
      })
      await loadCourse()
      toast.success("Quiz submitted")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to submit quiz.")
    } finally {
      setSubmittingModuleId(null)
    }
  }

  const submitFinalQuiz = async () => {
    try {
      setSubmittingModuleId(-1)
      await apiClient.post(`/api/courses/${courseId}/final-quiz/submit`, {
        answers: finalAnswers,
      })
      toast.success("Final quiz submitted")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to submit final quiz.")
    } finally {
      setSubmittingModuleId(null)
    }
  }

  if (loading) {
    return <div className="text-gray-300">Loading course...</div>
  }

  if (!course) {
    return <div className="text-red-100">Course not found.</div>
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <span className="rounded-full bg-[#1c1038] px-3 py-1 text-xs text-gray-300">
          {course.difficulty}
        </span>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-white">
          <BookOpen size={20} className="text-purple-400" />
          {course.title}
        </h1>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-2 w-60 rounded-full bg-[#1a0b33]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
              style={{ width: `${enrollment?.progress || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {enrollment?.progress || 0}% complete
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const isCompleted = completedModuleIds.has(module.id)
          const isUnlocked = module.orderIndex <= highestUnlockedOrder || isCompleted
          const moduleQuestions = questions[module.id] || []
          const moduleDocuments = documents[module.id] || []

          return (
            <div
              key={module.id}
              className="rounded-xl border border-purple-700/20 bg-[#0f0622] p-5"
            >
              <button
                type="button"
                onClick={() => void toggleModule(module)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-sm text-purple-400">
                    {module.orderIndex}
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-white">{module.title}</h2>
                    <p className="text-xs text-gray-400">
                      {isCompleted ? "Completed" : isUnlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                </div>

                {openModuleId === module.id ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {openModuleId === module.id && (
                <div className="mt-5 space-y-4">
                  {moduleDocuments.map((document) => (
                    <a
                      key={document.id}
                      href={document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg bg-[#0a0318] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Book size={16} className="text-gray-400" />
                        <span>{document.label} - {document.title}</span>
                      </div>
                      <span className="text-xs text-cyan-300">Open PDF</span>
                    </a>
                  ))}

                  {module.title === "Final Evaluation" ? (
                    <div className="space-y-4">
                      {finalQuestions.map((question) => (
                        <div key={question.id} className="rounded-lg bg-[#0a0318] p-4">
                          <p className="font-medium text-white">{question.questionText}</p>
                          <div className="mt-3 space-y-2">
                            {question.options.map((option, index) => (
                              <label key={index} className="flex items-center gap-3 text-sm text-gray-300">
                                <input
                                  type="radio"
                                  name={`final-${question.id}`}
                                  checked={finalAnswers[question.id] === index}
                                  onChange={() =>
                                    setFinalAnswers((current) => ({
                                      ...current,
                                      [question.id]: index,
                                    }))
                                  }
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => void submitFinalQuiz()}
                        disabled={submittingModuleId === -1}
                        className="btn-primary"
                      >
                        {submittingModuleId === -1 ? "Submitting..." : "Submit Final Quiz"}
                      </button>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/projects?courseId=${courseId}`}
                          className="rounded-lg border border-purple-700/40 px-4 py-2 text-sm text-white hover:bg-purple-500/10"
                        >
                          Submit Project
                        </Link>
                        <Link
                          href={`/upload?courseId=${courseId}`}
                          className="rounded-lg border border-cyan-700/40 px-4 py-2 text-sm text-white hover:bg-cyan-500/10"
                        >
                          Upload Video
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {moduleQuestions.map((question) => (
                        <div key={question.id} className="rounded-lg bg-[#0a0318] p-4">
                          <p className="font-medium text-white">{question.questionText}</p>
                          <div className="mt-3 space-y-2">
                            {question.options.map((option, index) => (
                              <label key={index} className="flex items-center gap-3 text-sm text-gray-300">
                                <input
                                  type="radio"
                                  name={`${module.id}-${question.id}`}
                                  checked={answers[module.id]?.[question.id] === index}
                                  onChange={() => updateModuleAnswer(module.id, question.id, index)}
                                  disabled={!isUnlocked}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => void submitModuleQuiz(module.id)}
                        disabled={!isUnlocked || submittingModuleId === module.id}
                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingModuleId === module.id ? "Submitting..." : "Submit Module Quiz"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
