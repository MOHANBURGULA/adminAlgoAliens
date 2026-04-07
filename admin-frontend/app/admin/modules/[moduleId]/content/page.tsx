"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  CirclePlus,
  FileCode2,
  Layers3,
  PencilLine,
  Save,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"
import Button from "@/components/admin/ui/Button"
import { ActivityTypeSelector } from "@/components/admin/module-builder/ActivityTypeSelector"
import { AnalysisEditor } from "@/components/admin/module-builder/AnalysisEditor"
import { CodingEditor } from "@/components/admin/module-builder/CodingEditor"
import { QuizBuilder } from "@/components/admin/module-builder/QuizBuilder"
import { SqlEditor } from "@/components/admin/module-builder/SqlEditor"
import { TheoryUploadForm } from "@/components/theory/TheoryUploadForm"
import { apiClient } from "@/lib/axios"
import { AdminQuestion, uploadBlobWithSignedUrl } from "@/lib/admin"
import { getApiErrorMessage } from "@/lib/http"
import {
  buildModuleActivityPayload,
  createConfigByType,
  createEmptyActivity,
  findCompilerLanguage,
  getActivityTypeLabel,
  hydrateModuleActivity,
  sortCompilerLanguages,
  validateModuleActivity,
  type AnalysisActivityConfig,
  type CodeExecutionResult,
  type CodingActivityConfig,
  type CompilerLanguage,
  type ModuleActivityDraft,
  type ModuleActivityType,
  type QuizActivityConfig,
  type SqlDebuggingActivityConfig,
} from "@/lib/module-activities"
import type { TheoryResource } from "@/lib/theory"

type ModuleDocument = {
  id: number
  label: string
  title: string
  fileUrl: string
  accessUrl?: string
}

type ModuleItem = {
  id: number
  title: string
}

export default function AdminModuleContentPage() {
  const params = useParams<{ moduleId: string }>()
  const searchParams = useSearchParams()
  const moduleId = Number(params?.moduleId || 0)
  const courseId = Number(searchParams?.get("courseId") || 0)

  const [moduleItem, setModuleItem] = useState<ModuleItem | null>(null)
  const [documents, setDocuments] = useState<ModuleDocument[]>([])
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [activities, setActivities] = useState<ModuleActivityDraft[]>([])
  const [languages, setLanguages] = useState<CompilerLanguage[]>([])
  const [compilerStatus, setCompilerStatus] = useState("")
  const [theoryResource, setTheoryResource] = useState<TheoryResource | null>(null)

  const [documentTitle, setDocumentTitle] = useState("")
  const [documentLabel, setDocumentLabel] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const [questionText, setQuestionText] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0)

  const [loading, setLoading] = useState(true)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null)
  const [activityDraft, setActivityDraft] = useState<ModuleActivityDraft>(
    createEmptyActivity(moduleId, 1),
  )

  const nextActivityOrder = useMemo(() => {
    if (activities.length === 0) {
      return 1
    }

    return Math.max(...activities.map((activity) => activity.orderIndex)) + 1
  }, [activities])

  const questionCount = useMemo(() => questions.length, [questions])
  const activityCount = useMemo(() => activities.length, [activities])

  const resetActivityDraft = useCallback(
    (activityType: ModuleActivityType = activityDraft.activityType) => {
      setActivityDraft(createEmptyActivity(moduleId, nextActivityOrder, activityType))
    },
    [activityDraft.activityType, moduleId, nextActivityOrder],
  )

  const loadContent = useCallback(async () => {
    const [modulesRes, documentsRes, questionsRes, activitiesRes, theoryRes] = await Promise.all([
      apiClient.get(`/api/courses/${courseId}/modules`),
      apiClient.get(`/api/courses/${courseId}/modules/${moduleId}/documents`),
      apiClient.get(`/api/admin/questions/${courseId}`),
      apiClient.get(`/api/admin/modules/${moduleId}/activities`),
      apiClient.get(`/api/theory/${moduleId}`),
    ])

    const moduleList = modulesRes.data as ModuleItem[]
    const activityList = (activitiesRes.data as unknown[]).map((activity) =>
      hydrateModuleActivity(activity),
    )

    setModuleItem(moduleList.find((entry) => entry.id === moduleId) || null)
    setDocuments(documentsRes.data as ModuleDocument[])
    setQuestions(
      (questionsRes.data as AdminQuestion[]).filter((question) => question.moduleId === moduleId),
    )
    setActivities(activityList)
    setTheoryResource((theoryRes.data as TheoryResource | null) || null)
  }, [courseId, moduleId])

  const loadCompilerLanguages = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/admin/module-activities/languages")
      setLanguages(sortCompilerLanguages(response.data as CompilerLanguage[]))
      setCompilerStatus("")
    } catch (error) {
      setLanguages([])
      setCompilerStatus(getApiErrorMessage(error))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await Promise.all([loadContent(), loadCompilerLanguages()])
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error))
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
  }, [courseId, loadCompilerLanguages, loadContent])

  useEffect(() => {
    if (!moduleId) {
      return
    }

    setActivityDraft((current) => {
      if (current.moduleId === moduleId && current.id) {
        return current
      }

      if (current.moduleId === moduleId && !current.id && current.orderIndex === nextActivityOrder) {
        return current
      }

      return createEmptyActivity(moduleId, nextActivityOrder, current.activityType)
    })
  }, [moduleId, nextActivityOrder])

  const submitDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!documentFile) {
      toast.error("Select a Markdown (.md) file first.")
      return
    }

    if (!documentFile.name.endsWith(".md")) {
      toast.error("Only .md (Markdown) files are accepted.")
      return
    }

    try {
      setUploadingDoc(true)
      const upload = await uploadBlobWithSignedUrl(documentFile.name, documentFile, "text/markdown")

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
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setUploadingDoc(false)
    }
  }

  const deleteDocument = async (docId: number) => {
    try {
      await apiClient.delete(`/api/admin/modules/documents/${docId}`)
      await loadContent()
      toast.success("Document deleted")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const submitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await apiClient.post("/api/admin/questions", {
        courseId,
        moduleId,
        type: moduleItem?.title === "Final Evaluation" ? "final" : "module",
        questionText,
        options,
        correctOptionIndex,
        expectedAnswer:
          moduleItem?.title === "Final Evaluation"
            ? "Explain your reasoning clearly in the final evaluation video."
            : undefined,
      })

      setQuestionText("")
      setOptions(["", "", "", ""])
      setCorrectOptionIndex(0)
      await loadContent()
      toast.success("Question added")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const deleteQuestion = async (questionId: number) => {
    try {
      await apiClient.delete(`/api/admin/questions/${questionId}`)
      await loadContent()
      toast.success("Question deleted")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const saveActivity = async () => {
    let preparedDraft: ModuleActivityDraft = activityDraft

    if (activityDraft.activityType === "coding") {
      const codingConfig = activityDraft.config as CodingActivityConfig
      const resolvedLanguage = findCompilerLanguage(languages, {
        languageId: codingConfig.languageId,
        languageKey: codingConfig.languageKey,
        languageName: codingConfig.languageName,
      })

      preparedDraft = {
        ...activityDraft,
        config: {
          ...codingConfig,
          languageKey: codingConfig.languageKey || resolvedLanguage?.key || "",
          languageName: codingConfig.languageName || resolvedLanguage?.name || "",
          languageEngine: codingConfig.languageEngine || resolvedLanguage?.engine || "",
        },
      }
    }

    const validationMessage = validateModuleActivity(preparedDraft)
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    try {
      setSavingActivity(true)
      const payload = buildModuleActivityPayload(preparedDraft)

      if (preparedDraft.id) {
        await apiClient.put(`/api/admin/module-activities/${preparedDraft.id}`, payload)
        toast.success("Activity updated")
      } else {
        await apiClient.post("/api/admin/module-activities", payload)
        toast.success("Activity created")
      }

      await loadContent()
      resetActivityDraft(preparedDraft.activityType)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSavingActivity(false)
    }
  }

  const deleteActivity = async (activityId: number) => {
    try {
      setDeletingActivityId(activityId)
      await apiClient.delete(`/api/admin/module-activities/${activityId}`)
      await loadContent()
      setActivityDraft((current) =>
        current.id === activityId
          ? createEmptyActivity(moduleId, nextActivityOrder, current.activityType)
          : current,
      )
      toast.success("Activity deleted")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setDeletingActivityId(null)
    }
  }

  const executeCode = async (payload: {
    expectedOutput?: string
    languageId?: number | null
    languageKey: string
    languageName: string
    sourceCode: string
    stdin?: string
  }) => {
    try {
      const response = await apiClient.post("/api/admin/module-activities/execute/code", payload)
      return response.data as CodeExecutionResult
    } catch (error) {
      toast.error(getApiErrorMessage(error))
      throw error instanceof Error ? error : new Error("Unable to run code.")
    }
  }

  const switchActivityType = (nextType: ModuleActivityType) => {
    setActivityDraft((current) => {
      if (current.activityType === nextType) {
        return current
      }

      return {
        ...current,
        activityType: nextType,
        config: createConfigByType(nextType),
      }
    })
  }

  if (!courseId) {
    return <div className="text-red-100">Missing courseId in the route.</div>
  }

  if (loading) {
    return <div className="text-gray-300">Loading module content...</div>
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
          <Layers3 size={14} />
          Module content studio
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-white">
            {moduleItem?.title || `Module #${moduleId}`} Content
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
            Manage theory documents, interactive activities, and quiz questions from one clear
            admin workflow. Coding activities can now run through local Judge0, a guarded SQL
            sandbox, or a MongoDB query sandbox depending on the selected language.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Documents</p>
          <p className="mt-4 text-3xl font-semibold text-white">{documents.length}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Interactive activities</p>
          <p className="mt-4 text-3xl font-semibold text-white">{activityCount}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Quiz questions</p>
          <p className="mt-4 text-3xl font-semibold text-white">{questionCount}</p>
        </div>
      </section>

      {compilerStatus ? (
        <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Execution service status: {compilerStatus}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-6">
          <TheoryUploadForm
            moduleId={moduleId}
            resource={theoryResource}
            onUploaded={(resource) => setTheoryResource(resource)}
          />

          <form onSubmit={submitDocument} className="surface-panel p-6">
            <h2 className="text-xl font-semibold text-white">Markdown document upload</h2>
            <p className="mt-2 text-sm text-slate-400">
              Only <code className="rounded bg-white/5 px-1 text-indigo-300">.md</code> files are accepted.
            </p>

            <div className="mt-5 space-y-4">
              <input
                value={documentLabel}
                onChange={(event) => setDocumentLabel(event.target.value)}
                placeholder="Label (for example 1.1)"
                className="input-ui"
                required
              />
              <input
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                placeholder="Document title"
                className="input-ui"
                required
              />
              <input
                type="file"
                accept=".md,text/markdown"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                className="input-ui"
              />
              <Button type="submit" variant="primary" className="w-full" disabled={uploadingDoc}>
                {uploadingDoc ? "Uploading..." : "Upload markdown"}
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500">No documents uploaded yet.</p>
              ) : (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-white/10 bg-[#12092A] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <a
                        href={document.accessUrl ?? document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-white hover:text-indigo-300"
                      >
                        {document.label} - {document.title}
                      </a>
                      <button
                        type="button"
                        onClick={() => void deleteDocument(document.id)}
                        className="text-xs text-rose-200 transition hover:text-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </form>

          <div className="surface-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Saved activities</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Edit an existing builder entry or start a fresh activity draft.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resetActivityDraft(activityDraft.activityType)}
              >
                <CirclePlus size={14} />
                New
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-500">No interactive activities yet.</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={[
                      "rounded-[24px] border p-4 transition-all",
                      activityDraft.id === activity.id
                        ? "border-fuchsia-400/30 bg-fuchsia-500/10"
                        : "border-white/10 bg-[#100A1B] hover:border-white/15",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActivityDraft(activity)}
                        className="min-w-0 text-left"
                      >
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          {getActivityTypeLabel(activity.activityType)} - Order {activity.orderIndex}
                        </p>
                        <p className="mt-2 truncate text-sm font-medium text-white">
                          {activity.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-400">
                          {activity.description || "No description yet."}
                        </p>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActivityDraft(activity)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 text-slate-200 transition hover:bg-white/[0.06]"
                        >
                          <PencilLine size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => activity.id && void deleteActivity(activity.id)}
                          disabled={deletingActivityId === activity.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-500/20 text-rose-100 transition hover:bg-rose-500/10 disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="surface-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">Interactive activity builder</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Fill in the activity basics, choose the activity type, then use the matching editor that opens automatically.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-400">
              <FileCode2 size={14} />
              {activityDraft.id ? "Editing saved activity" : "Creating new activity"}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 1</p>
                <p className="mt-2 text-sm font-medium text-white">Add the basics</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Set the title, order, and short description before opening the detailed editor.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 2</p>
                <p className="mt-2 text-sm font-medium text-white">Choose the activity type</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Coding, SQL, analysis, and quiz each open a different builder automatically.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 3</p>
                <p className="mt-2 text-sm font-medium text-white">Configure and save</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Use the editor below, test locally if needed, then save the activity into this module.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 1</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Activity basics</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                These details help you identify the activity quickly in the saved list.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <input
                  value={activityDraft.title}
                  onChange={(event) =>
                    setActivityDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Activity title"
                  className="input-ui"
                />
                <input
                  type="number"
                  min={1}
                  value={activityDraft.orderIndex}
                  onChange={(event) =>
                    setActivityDraft((current) => ({
                      ...current,
                      orderIndex: Number(event.target.value || 1),
                    }))
                  }
                  placeholder="Order"
                  className="input-ui"
                />
              </div>

              <textarea
                value={activityDraft.description}
                onChange={(event) =>
                  setActivityDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Short description for admins and future learner-side rendering."
                className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
              />
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 2</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Choose the activity type</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pick the format you want to build and the right editing surface opens below.
              </p>

              <div className="mt-4">
                <ActivityTypeSelector value={activityDraft.activityType} onChange={switchActivityType} />
              </div>
            </div>

            {activityDraft.activityType === "coding" ? (
              <CodingEditor
                value={activityDraft.config as CodingActivityConfig}
                languages={languages}
                onExecute={executeCode}
                onChange={(config) =>
                  setActivityDraft((current) => ({
                    ...current,
                    config,
                  }))
                }
              />
            ) : null}

            {activityDraft.activityType === "sql_debugging" ? (
              <SqlEditor
                value={activityDraft.config as SqlDebuggingActivityConfig}
                onChange={(config) =>
                  setActivityDraft((current) => ({
                    ...current,
                    config,
                  }))
                }
              />
            ) : null}

            {activityDraft.activityType === "analysis" ? (
              <AnalysisEditor
                value={activityDraft.config as AnalysisActivityConfig}
                onChange={(config) =>
                  setActivityDraft((current) => ({
                    ...current,
                    config,
                  }))
                }
              />
            ) : null}

            {activityDraft.activityType === "quiz" ? (
              <QuizBuilder
                value={activityDraft.config as QuizActivityConfig}
                onChange={(config) =>
                  setActivityDraft((current) => ({
                    ...current,
                    config,
                  }))
                }
              />
            ) : null}

            <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 3</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Save this activity</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Save the current draft into this module, or reset the draft if you want to start over.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={savingActivity}
                  onClick={() => void saveActivity()}
                >
                  <Save size={16} />
                  {savingActivity ? "Saving..." : activityDraft.id ? "Update activity" : "Save activity"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => resetActivityDraft(activityDraft.activityType)}
                >
                  Reset draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submitQuestion} className="surface-panel p-6">
        <h2 className="text-xl font-semibold text-white">Quiz questions</h2>
        <p className="mt-2 text-sm text-slate-400">
          Existing questions for this module: {questionCount}
        </p>

        <div className="mt-5 space-y-4">
          <textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder="Question text"
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
            required
          />

          {options.map((option, index) => (
            <input
              key={index}
              value={option}
              onChange={(event) =>
                setOptions((current) =>
                  current.map((entry, optionIndex) =>
                    optionIndex === index ? event.target.value : entry,
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
            onChange={(event) => setCorrectOptionIndex(Number(event.target.value))}
            className="input-ui"
          >
            <option value={0}>Correct option: 1</option>
            <option value={1}>Correct option: 2</option>
            <option value={2}>Correct option: 3</option>
            <option value={3}>Correct option: 4</option>
          </select>

          <Button type="submit" variant="primary">
            Add question
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-white/10 bg-[#12092A] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{question.questionText}</p>
                  <p className="mt-2 text-xs text-slate-400">{question.type} question</p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteQuestion(question.id)}
                  className="text-xs text-rose-200 transition hover:text-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}
