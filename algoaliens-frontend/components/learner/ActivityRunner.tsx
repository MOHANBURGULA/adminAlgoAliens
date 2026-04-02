"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Code2, Database, FileText, HelpCircle, Play } from "lucide-react"
import { getApiErrorMessage } from "@/lib/http"
import { getStarterCode } from "@/lib/starter-code"
import {
  submitModuleActivity,
  type ActivityType,
  type ModuleActivity,
} from "@/lib/learning"
import { LazyMonacoEditor } from "@/components/ui/LazyMonacoEditor"

const languageOptions = [
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Python 3", value: "python3" },
  { label: "TypeScript", value: "typescript" },
  { label: "Node.js", value: "nodejs" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
] as const

type ActivityRunnerProps = {
  activities: ModuleActivity[]
}

type ActivitySourceState = Record<number, Record<string, string>>

type SubmissionState = {
  error?: string
  result?: Record<string, unknown>
}

function getActivityIcon(activityType: ActivityType) {
  if (activityType === "SQL_DEBUGGING") {
    return Database
  }

  if (activityType === "CODE_SNIPPET") {
    return Code2
  }

  if (activityType === "ANALYSIS") {
    return FileText
  }

  return HelpCircle
}

function getEditorLanguage(language: string | undefined, activityType: ActivityType) {
  if (activityType === "SQL_DEBUGGING") {
    return "sql"
  }

  if (language === "cpp") return "cpp"
  if (language === "python3") return "python"
  if (language === "nodejs") return "javascript"
  return language || "javascript"
}

function getDefaultLanguage(activity: ModuleActivity) {
  if (activity.activityType === "SQL_DEBUGGING") {
    return "sql"
  }

  return activity.content.language || "python3"
}

function getStarterCodeForActivity(activity: ModuleActivity, language: string) {
  if (activity.activityType === "SQL_DEBUGGING") {
    return activity.content.starterCode || ""
  }

  const activityLanguage = getDefaultLanguage(activity)

  if (language === activityLanguage && activity.content.starterCode?.trim()) {
    return activity.content.starterCode
  }

  return getStarterCode(language) || activity.content.starterCode || ""
}

function getSourceValue(
  sourcesByActivity: ActivitySourceState,
  activity: ModuleActivity,
  language: string,
) {
  const storedSource = sourcesByActivity[activity.id]?.[language]

  if (typeof storedSource === "string") {
    return storedSource
  }

  return getStarterCodeForActivity(activity, language)
}

export function ActivityRunner({ activities }: ActivityRunnerProps) {
  const [busyActivityId, setBusyActivityId] = useState<number | null>(null)
  const [sourcesByActivity, setSourcesByActivity] = useState<ActivitySourceState>({})
  const [languageByActivity, setLanguageByActivity] = useState<Record<number, string>>({})
  const [answersByActivity, setAnswersByActivity] = useState<Record<number, string>>({})
  const [selectedChoices, setSelectedChoices] = useState<Record<number, number>>({})
  const [submissions, setSubmissions] = useState<Record<number, SubmissionState>>({})

  const sortedActivities = useMemo(
    () => [...activities].sort((left, right) => left.id - right.id),
    [activities],
  )

  useEffect(() => {
    setSourcesByActivity((current) => {
      let changed = false
      const nextSources = { ...current }

      for (const activity of activities) {
        if (
          activity.activityType !== "CODE_SNIPPET" &&
          activity.activityType !== "SQL_DEBUGGING"
        ) {
          continue
        }

        const language = languageByActivity[activity.id] || getDefaultLanguage(activity)
        const currentByLanguage = nextSources[activity.id] || {}

        if (typeof currentByLanguage[language] === "string") {
          continue
        }

        nextSources[activity.id] = {
          ...currentByLanguage,
          [language]: getStarterCodeForActivity(activity, language),
        }
        changed = true
      }

      return changed ? nextSources : current
    })
  }, [activities, languageByActivity])

  const handleRun = async (activity: ModuleActivity) => {
    try {
      setBusyActivityId(activity.id)
      const currentLanguage = languageByActivity[activity.id] || getDefaultLanguage(activity)

      const payload =
        activity.activityType === "SQL_DEBUGGING" || activity.activityType === "CODE_SNIPPET"
          ? {
              activityId: activity.id,
              sourceCode: getSourceValue(sourcesByActivity, activity, currentLanguage),
              language: currentLanguage,
            }
          : activity.activityType === "ANALYSIS"
            ? {
                activityId: activity.id,
                answer: answersByActivity[activity.id] || "",
              }
            : {
                activityId: activity.id,
                selectedOptionIndex: selectedChoices[activity.id],
              }

      const submission = await submitModuleActivity(payload)
      setSubmissions((current) => ({
        ...current,
        [activity.id]: {
          result: submission.result,
        },
      }))

      toast.success(
        activity.activityType === "ANALYSIS" || activity.activityType === "QUIZ"
          ? "Activity submitted"
          : "Execution complete",
      )
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to submit activity.")
      setSubmissions((current) => ({
        ...current,
        [activity.id]: {
          error: message,
        },
      }))
      toast.error(message)
    } finally {
      setBusyActivityId(null)
    }
  }

  if (sortedActivities.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0B0518] p-5 text-sm text-gray-300">
        No interactive activities are configured for this module yet.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {sortedActivities.map((activity) => {
        const Icon = getActivityIcon(activity.activityType)
        const submission = submissions[activity.id]
        const currentLanguage =
          languageByActivity[activity.id] || getDefaultLanguage(activity)
        const sourceValue = getSourceValue(sourcesByActivity, activity, currentLanguage)

        return (
          <section
            key={activity.id}
            className="rounded-[24px] border border-white/10 bg-[#12092A]/80 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0B0518] text-indigo-200">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
                    {activity.activityType.replaceAll("_", " ")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {activity.content.description}
                  </h3>
                </div>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                Activity #{activity.id}
              </span>
            </div>

            {activity.activityType === "SQL_DEBUGGING" && activity.content.sqlSchema ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-[#0B0518] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Schema</p>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-gray-200">
                  {activity.content.sqlSchema}
                </pre>
              </div>
            ) : null}

            {(activity.activityType === "SQL_DEBUGGING" ||
              activity.activityType === "CODE_SNIPPET") && (
              <div className="mt-5 space-y-4">
                {activity.activityType === "CODE_SNIPPET" ? (
                  <div className="max-w-xs">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Language
                    </label>
                    <select
                      value={currentLanguage}
                      onChange={(event) => {
                        const nextLanguage = event.target.value

                        setLanguageByActivity((current) => ({
                          ...current,
                          [activity.id]: nextLanguage,
                        }))
                      }}
                      className="input-ui"
                    >
                      {languageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <LazyMonacoEditor
                  height={320}
                  language={getEditorLanguage(currentLanguage, activity.activityType)}
                  value={sourceValue}
                  onChange={(nextValue) =>
                    setSourcesByActivity((current) => ({
                      ...current,
                      [activity.id]: {
                        ...(current[activity.id] || {}),
                        [currentLanguage]: nextValue,
                      },
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={() => void handleRun(activity)}
                  disabled={busyActivityId === activity.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Play size={16} />
                  {busyActivityId === activity.id ? "Running..." : "Run Activity"}
                </button>
              </div>
            )}

            {activity.activityType === "ANALYSIS" ? (
              <div className="mt-5 space-y-4">
                <textarea
                  value={answersByActivity[activity.id] || ""}
                  onChange={(event) =>
                    setAnswersByActivity((current) => ({
                      ...current,
                      [activity.id]: event.target.value,
                    }))
                  }
                  placeholder="Write your theory-based answer here."
                  className="input-ui min-h-36"
                />

                <button
                  type="button"
                  onClick={() => void handleRun(activity)}
                  disabled={busyActivityId === activity.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyActivityId === activity.id ? "Submitting..." : "Submit Analysis"}
                </button>
              </div>
            ) : null}

            {activity.activityType === "QUIZ" ? (
              <div className="mt-5 space-y-3">
                {(activity.content.choices || []).map((choice, index) => (
                  <label
                    key={`${activity.id}-choice-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B0518] px-4 py-3 text-sm text-gray-200"
                  >
                    <input
                      type="radio"
                      name={`activity-${activity.id}`}
                      checked={selectedChoices[activity.id] === index}
                      onChange={() =>
                        setSelectedChoices((current) => ({
                          ...current,
                          [activity.id]: index,
                        }))
                      }
                    />
                    {choice.label}
                  </label>
                ))}

                <button
                  type="button"
                  onClick={() => void handleRun(activity)}
                  disabled={busyActivityId === activity.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyActivityId === activity.id ? "Checking..." : "Submit Quiz"}
                </button>
              </div>
            ) : null}

            {submission?.error ? (
              <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                {submission.error}
              </div>
            ) : null}

            {submission?.result ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-[#0B0518] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Score</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {typeof submission.result.score === "number"
                      ? `${submission.result.score}%`
                      : submission.result.correct === true
                        ? "Correct"
                        : submission.result.correct === false
                          ? "Incorrect"
                          : submission.result.accepted === true
                            ? "Accepted"
                            : "Submitted"}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0B0518] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Status</p>
                  <p className="mt-2 text-sm text-gray-200">
                    {String(
                      submission.result.status ||
                        submission.result.feedback ||
                        "Completed",
                    )}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0B0518] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                    Runtime
                  </p>
                  <p className="mt-2 text-sm text-gray-200">
                    {submission.result.executionTime
                      ? `${String(submission.result.executionTime)}s`
                      : "N/A"}
                  </p>
                </div>

                {submission.result.output ? (
                  <div className="rounded-3xl border border-white/10 bg-[#0B0518] p-4 lg:col-span-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Output</p>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-gray-200">
                      {String(submission.result.output)}
                    </pre>
                  </div>
                ) : null}

                {submission.result.errors ? (
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 lg:col-span-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-200">Errors</p>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-red-100">
                      {String(submission.result.errors)}
                    </pre>
                  </div>
                ) : null}

                {Array.isArray(submission.result.matchedKeywords) ? (
                  <div className="rounded-3xl border border-white/10 bg-[#0B0518] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                      Matched Keywords
                    </p>
                    <p className="mt-3 text-sm text-gray-200">
                      {submission.result.matchedKeywords.join(", ") || "None yet"}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
