"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"
import { AdminQuestion, uploadBlobWithSignedUrl } from "@/lib/admin"

type ModuleDocument = {
  id: number
  label: string
  title: string
  fileUrl: string
}

type Module = {
  id: number
  title: string
}

export default function AdminModuleContentPage() {
  const params = useParams<{ moduleId: string }>()
  const searchParams = useSearchParams()
  const moduleId = Number(params.moduleId)
  const courseId = Number(searchParams.get("courseId"))
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

  const loadContent = async () => {
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
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await loadContent()
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.response?.data?.message || "Unable to load module content.")
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
  }, [courseId, moduleId])

  const submitDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!documentFile) {
      toast.error("Select a PDF file first.")
      return
    }

    try {
      const upload = await uploadBlobWithSignedUrl(
        documentFile.name,
        documentFile,
        documentFile.type || "application/pdf",
      )

      await apiClient.post("/api/admin/modules/documents", {
        moduleId,
        label: documentLabel,
        title: documentTitle,
        fileUrl: upload.fileUrl,
      })

      setDocumentFile(null)
      setDocumentLabel("")
      setDocumentTitle("")
      await loadContent()
      toast.success("Document uploaded")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to upload document.")
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to add question.")
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
          Manage PDFs and quiz questions using existing admin APIs. Module tutorial
          video content is not persisted by the current backend route set.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={submitDocument}
          className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
        >
          <h2 className="text-xl font-semibold text-white">PDF Upload</h2>
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
              <a
                key={document.id}
                href={document.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl bg-[#12092A] p-4 text-sm text-white hover:bg-[#1A0F32]"
              >
                {document.label} - {document.title}
              </a>
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
    </div>
  )
}
