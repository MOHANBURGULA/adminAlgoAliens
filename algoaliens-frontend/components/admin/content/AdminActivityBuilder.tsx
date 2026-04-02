"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  createAdminActivity,
  fetchAdminModuleActivities,
} from "@/lib/admin"
import { getApiErrorMessage } from "@/lib/http"
import type {
  ActivityContent,
  ActivityType,
  ModuleActivity,
} from "@/lib/learning"
import { getStarterCode } from "@/lib/starter-code"
import { LazyMonacoEditor } from "@/components/ui/LazyMonacoEditor"

const activityTypeMeta: Array<{
  description: string
  label: string
  value: ActivityType
}> = [
  {
    value: "SQL_DEBUGGING",
    label: "SQL Debugging",
    description: "SQL editor with schema and executable validation.",
  },
  {
    value: "CODE_SNIPPET",
    label: "Code Snippet",
    description: "Multi-language coding prompt with local Judge0 execution.",
  },
  {
    value: "ANALYSIS",
    label: "Analysis",
    description: "Theory-first long-answer reflection prompt.",
  },
  {
    value: "QUIZ",
    label: "Quiz",
    description: "MCQ activity with instant validation.",
  },
]

const languageOptions = [
  "c",
  "cpp",
  "java",
  "javascript",
  "python",
  "python3",
  "typescript",
  "nodejs",
  "html",
  "css",
] as const

type TestCaseForm = {
  input: string
  isHidden: boolean
  output: string
}

type AdminActivityBuilderProps = {
  moduleId: number
}

function getEditorLanguage(activityType: ActivityType, language: string) {
  if (activityType === "SQL_DEBUGGING") {
    return "sql"
  }

  if (language === "cpp") {
    return "cpp"
  }

  if (language === "python3") {
    return "python"
  }

  if (language === "nodejs") {
    return "javascript"
  }

  return language || "javascript"
}

export function AdminActivityBuilder({ moduleId }: AdminActivityBuilderProps) {
  const [activities, setActivities] = useState<ModuleActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>("CODE_SNIPPET")
  const [description, setDescription] = useState("")
  const [starterCode, setStarterCode] = useState<string>(getStarterCode("python3"))
  const [starterCodesByLanguage, setStarterCodesByLanguage] = useState<Record<string, string>>({
    python3: getStarterCode("python3"),
  })
  const [expectedOutput, setExpectedOutput] = useState("")
  const [sqlSchema, setSqlSchema] = useState("")
  const [explanation, setExplanation] = useState("")
  const [language, setLanguage] = useState<(typeof languageOptions)[number]>("python3")
  const [testCases, setTestCases] = useState<TestCaseForm[]>([
    { input: "", output: "", isHidden: false },
  ])
  const [choices, setChoices] = useState(["", "", "", ""])
  const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0)

  const activeMeta = useMemo(
    () => activityTypeMeta.find((entry) => entry.value === activityType),
    [activityType],
  )

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      const nextActivities = await fetchAdminModuleActivities(moduleId)
      setActivities(nextActivities)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load module activities."))
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  useEffect(() => {
    if (activityType !== "CODE_SNIPPET") {
      return
    }

    setStarterCodesByLanguage((current) => {
      if (typeof current[language] === "string") {
        return current
      }

      return {
        ...current,
        [language]: getStarterCode(language),
      }
    })
  }, [activityType, language])

  useEffect(() => {
    if (activityType !== "CODE_SNIPPET") {
      return
    }

    const nextStarterCode =
      typeof starterCodesByLanguage[language] === "string"
        ? starterCodesByLanguage[language]
        : getStarterCode(language)
    setStarterCode(nextStarterCode)
  }, [activityType, language, starterCodesByLanguage])

  const resetForm = () => {
    setDescription("")
    setStarterCode(getStarterCode("python3"))
    setStarterCodesByLanguage({ python3: getStarterCode("python3") })
    setExpectedOutput("")
    setSqlSchema("")
    setExplanation("")
    setLanguage("python3")
    setTestCases([{ input: "", output: "", isHidden: false }])
    setChoices(["", "", "", ""])
    setCorrectChoiceIndex(0)
  }

  const buildContent = (): ActivityContent => {
    const normalizedTestCases = testCases
      .filter((testCase) => testCase.input.trim() || testCase.output.trim())
      .map((testCase) => ({
        input: testCase.input.trim() || undefined,
        output: testCase.output.trim() || undefined,
        isHidden: testCase.isHidden,
      }))

    const content: ActivityContent = {
      description: description.trim(),
    }

    if (activityType === "SQL_DEBUGGING" || activityType === "CODE_SNIPPET") {
      content.starterCode = starterCode
      content.expectedOutput = expectedOutput.trim() || undefined
      content.testCases = normalizedTestCases
      content.language = activityType === "SQL_DEBUGGING" ? "sql" : language
    }

    if (activityType === "SQL_DEBUGGING") {
      content.sqlSchema = sqlSchema
    }

    if (activityType === "ANALYSIS" || activityType === "QUIZ") {
      content.explanation = explanation.trim()
    }

    if (activityType === "QUIZ") {
      content.choices = choices
        .map((choice) => choice.trim())
        .filter(Boolean)
        .map((choice) => ({ label: choice }))
      content.correctChoiceIndex = correctChoiceIndex
    }

    return content
  }

  const handleCreateActivity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSaving(true)
      await createAdminActivity({
        moduleId,
        activityType,
        content: buildContent(),
      })
      toast.success("Activity created")
      resetForm()
      await loadActivities()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create activity."))
    } finally {
      setSaving(false)
    }
  }

  const handleStarterCodeChange = (nextValue: string) => {
    setStarterCode(nextValue)

    if (activityType !== "CODE_SNIPPET") {
      return
    }

    setStarterCodesByLanguage((current) => ({
      ...current,
      [language]: nextValue,
    }))
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0B0518] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Interactive Activity Builder</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Attach executable coding tasks, theory prompts, or MCQs to this module.
            Compiler behavior is selected from the chosen activity type.
          </p>
        </div>
        {activeMeta ? (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
            {activeMeta.description}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleCreateActivity} className="mt-6 space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={(event) => setActivityType(event.target.value as ActivityType)}
              className="input-ui"
            >
              {activityTypeMeta.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>

          {activityType === "CODE_SNIPPET" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Language
              </label>
              <select
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as (typeof languageOptions)[number])
                }
                className="input-ui"
              >
                {languageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain what the learner needs to do."
            className="input-ui min-h-28"
            required
          />
        </div>

        {activityType === "SQL_DEBUGGING" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                SQL Schema
              </label>
              <LazyMonacoEditor
                height={220}
                language="sql"
                value={sqlSchema}
                onChange={setSqlSchema}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Starter SQL
              </label>
              <LazyMonacoEditor
                height={240}
                language="sql"
                value={starterCode}
                onChange={setStarterCode}
              />
            </div>
          </div>
        ) : null}

        {activityType === "CODE_SNIPPET" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Starter Code
            </label>
            <LazyMonacoEditor
              height={280}
              language={getEditorLanguage(activityType, language)}
              value={starterCode}
              onChange={handleStarterCodeChange}
            />
          </div>
        ) : null}

        {(activityType === "CODE_SNIPPET" || activityType === "SQL_DEBUGGING") && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Expected Output
              </label>
              <textarea
                value={expectedOutput}
                onChange={(event) => setExpectedOutput(event.target.value)}
                placeholder="Optional expected output for quick validation."
                className="input-ui min-h-24"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Test Cases</h3>
                <button
                  type="button"
                  onClick={() =>
                    setTestCases((current) => [
                      ...current,
                      { input: "", output: "", isHidden: false },
                    ])
                  }
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-gray-200 transition hover:bg-white/[0.06]"
                >
                  Add Test Case
                </button>
              </div>

              {testCases.map((testCase, index) => (
                <div
                  key={`test-case-${index}`}
                  className="grid gap-3 rounded-3xl border border-white/10 bg-[#12092A] p-4 lg:grid-cols-[1fr_1fr_auto]"
                >
                  <textarea
                    value={testCase.input}
                    onChange={(event) =>
                      setTestCases((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, input: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    placeholder="Input"
                    className="input-ui min-h-24"
                  />
                  <textarea
                    value={testCase.output}
                    onChange={(event) =>
                      setTestCases((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, output: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    placeholder="Expected output"
                    className="input-ui min-h-24"
                  />
                  <div className="flex flex-col justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={testCase.isHidden}
                        onChange={(event) =>
                          setTestCases((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, isHidden: event.target.checked }
                                : entry,
                            ),
                          )
                        }
                      />
                      Hidden
                    </label>
                    {testCases.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setTestCases((current) =>
                            current.filter((_, entryIndex) => entryIndex !== index),
                          )
                        }
                        className="rounded-2xl border border-red-500/20 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activityType === "ANALYSIS" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Reference Explanation
            </label>
            <textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder="Store the core talking points the learner answer should cover."
              className="input-ui min-h-32"
              required
            />
          </div>
        ) : null}

        {activityType === "QUIZ" ? (
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              {choices.map((choice, index) => (
                <input
                  key={`choice-${index}`}
                  value={choice}
                  onChange={(event) =>
                    setChoices((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? event.target.value : entry,
                      ),
                    )
                  }
                  placeholder={`Choice ${index + 1}`}
                  className="input-ui"
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Correct Choice
                </label>
                <select
                  value={correctChoiceIndex}
                  onChange={(event) => setCorrectChoiceIndex(Number(event.target.value))}
                  className="input-ui"
                >
                  {choices.map((_, index) => (
                    <option key={`correct-${index}`} value={index}>
                      Choice {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Explanation
                </label>
                <textarea
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder="Explain why the correct answer is right."
                  className="input-ui min-h-24"
                />
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving activity..." : "Create Activity"}
        </button>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Existing Activities</h3>
          {loading ? <span className="text-sm text-gray-400">Refreshing...</span> : null}
        </div>

        <div className="mt-4 space-y-3">
          {!loading && activities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#12092A] p-5 text-sm text-gray-300">
              No activities have been attached to this module yet.
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-3xl border border-white/10 bg-[#12092A] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-purple-200">
                      {activity.activityType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-gray-200">
                      {activity.content.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                    #{activity.id}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
