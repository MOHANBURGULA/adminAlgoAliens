"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"
import {
  AdminQuestion,
  uploadModulePdfDocument,
} from "@/lib/admin"
import { AdminActivityBuilder } from "@/components/admin/content/AdminActivityBuilder"
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary"

type ModuleDocument = {
  id: number
  label: string
  title: string
  fileUrl: string
  parseStatus?: string | null
  pageCount?: number | null
}

type Module = {
  id: number
  title: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (
      (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    )
  }

  return fallback
}

function AdminModuleContentPageContent() {
  const params = useParams<{ moduleId: string }>()
  const searchParams = useSearchParams()
  const moduleId = Number(params?.moduleId || 0)
  const courseId = Number(searchParams?.get("courseId") || 0)
  const [module, setModule] = useState<Module | null>(null)
  const [documents, setDocuments] = useState<ModuleDocument[]>([])
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [documentTitle, setDocumentTitle] = useState("")
  const [documentLabel, setDocumentLabel] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [questionText, setQuestionText] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadContent = useCallback(async () => {
    const [modulesRes, documentsRes, questionsRes] = await Promise.all([
      apiClient.get(`/api/courses/${courseId}/modules`),
      apiClient.get(`/api/courses/${courseId}/modules/${moduleId}/documents`),
      apiClient.get(`/api/admin/questions/${courseId}`),
    ])

    const moduleList = modulesRes.data as Module[]
    setModule(moduleList.find((entry) => entry.id === moduleId) || null)
    setDocuments(documentsRes.data as ModuleDocument[])
    setQuestions(
      (questionsRes.data as AdminQuestion[]).filter(
        (question) => question.moduleId === moduleId,
      ),
    )
  }, [courseId, moduleId])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await loadContent()
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(getErrorMessage(error, "Unable to load module content."))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (courseId) {
      void run()
    }

    return () => {
      cancelled = true
    }
  }, [courseId, loadContent])

  const submitDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!documentFile) {
      toast.error("Select a PDF file first.")
      return
    }

    try {
      await uploadModulePdfDocument({
        moduleId,
        label: documentLabel,
        title: documentTitle,
        file: documentFile,
      })

      setDocumentFile(null)
      setDocumentLabel("")
      setDocumentTitle("")
      await loadContent()
      toast.success("Document uploaded")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to upload document."))
    }
  }

  const submitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await apiClient.post("/api/admin/questions", {
        courseId,
        moduleId,
        type: module?.title === "Final Evaluation" ? "final" : "module",
        questionText,
        options,
        correctOptionIndex,
        expectedAnswer:
          module?.title === "Final Evaluation"
            ? "Explain your reasoning clearly in the final evaluation video."
            : undefined,
      })

      setQuestionText("")
      setOptions(["", "", "", ""])
      setCorrectOptionIndex(0)
      await loadContent()
      toast.success("Question added")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to add question."))
    }
  }

  const questionCount = useMemo(() => questions.length, [questions])

  if (!courseId) {
    return <div className="text-red-100">Missing courseId in the route.</div>
  }

  if (loading) {
    return <div className="text-gray-300">Loading module content...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {module?.title || `Module #${moduleId}`} Content
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage parsed learning PDFs, activity-based content, and quiz checkpoints
          for this module.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={submitDocument}
          className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
        >
          <h2 className="text-xl font-semibold text-white">PDF Upload</h2>
          <p className="mt-2 text-sm text-gray-400">
            Upload through the backend so the PDF is parsed into interactive lesson
            sections automatically.
          </p>
          <div className="mt-5 space-y-4">
            <input
              value={documentLabel}
              onChange={(e) => setDocumentLabel(e.target.value)}
              placeholder="Label (e.g. 1.1)"
              className="input-ui"
              required
            />
            <input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Document title"
              className="input-ui"
              required
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              className="input-ui"
            />
            <button type="submit" className="btn-primary w-full">
              Upload PDF
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-xl bg-[#12092A] p-4 text-sm text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:text-purple-200"
                  >
                    {document.label} - {document.title}
                  </a>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                    {document.parseStatus === "completed"
                      ? `${document.pageCount || 0} pages parsed`
                      : document.parseStatus === "failed"
                        ? "Parse failed"
                        : "Pending parse"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={submitQuestion}
          className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
        >
          <h2 className="text-xl font-semibold text-white">Quiz Questions</h2>
          <p className="mt-2 text-sm text-gray-400">
            Existing questions for this module: {questionCount}
          </p>

          <div className="mt-5 space-y-4">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Question text"
              className="input-ui min-h-28"
              required
            />

            {options.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(e) =>
                  setOptions((current) =>
                    current.map((entry, optionIndex) =>
                      optionIndex === index ? e.target.value : entry,
                    ),
                  )
                }
                placeholder={`Option ${index + 1}`}
                className="input-ui"
                required
              />
            ))}

            <select
              value={correctOptionIndex}
              onChange={(e) => setCorrectOptionIndex(Number(e.target.value))}
              className="input-ui"
            >
              <option value={0}>Correct option: 1</option>
              <option value={1}>Correct option: 2</option>
              <option value={2}>Correct option: 3</option>
              <option value={3}>Correct option: 4</option>
            </select>

            <button type="submit" className="btn-primary w-full">
              Add Question
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-xl bg-[#12092A] p-4">
                <p className="text-sm font-medium text-white">{question.questionText}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {question.type} question
                </p>
              </div>
            ))}
          </div>
        </form>
      </div>

      <FeatureErrorBoundary fallbackMessage="The activity builder hit an issue. Refresh and try again.">
        <AdminActivityBuilder moduleId={moduleId} />
      </FeatureErrorBoundary>
    </div>
  )
}

export default function AdminModuleContentPage() {
  return (
    <Suspense
      fallback={<div className="text-gray-300">Loading module content...</div>}
    >
      <AdminModuleContentPageContent />
    </Suspense>
  )
}
