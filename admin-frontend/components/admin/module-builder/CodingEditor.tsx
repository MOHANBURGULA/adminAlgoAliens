"use client"

import { useEffect, useMemo, useState } from "react"
import Editor from "@monaco-editor/react"
import {
  CircleHelp,
  Database,
  ListChecks,
  Play,
  ServerCog,
  SquareTerminal,
  WandSparkles,
} from "lucide-react"
import Button from "@/components/admin/ui/Button"
import {
  findCompilerLanguage,
  getMonacoLanguage,
  getStarterTemplateForLanguage,
  type CodeExecutionResult,
  type CodingActivityConfig,
  type CompilerLanguage,
} from "@/lib/module-activities"
import { TestCaseManager } from "./TestCaseManager"

type CodingEditorProps = {
  languages: CompilerLanguage[]
  onChange: (value: CodingActivityConfig) => void
  onExecute: (value: {
    expectedOutput?: string
    languageId?: number | null
    languageKey: string
    languageName: string
    sourceCode: string
    stdin?: string
  }) => Promise<CodeExecutionResult>
  value: CodingActivityConfig
}

const BUILD_STEPS = [
  {
    title: "1. Select the language",
    description: "Pick C, Java, Python, SQL, MongoDB, or another supported mode. The starter template loads automatically.",
  },
  {
    title: "2. Explain the task",
    description: "Describe the goal, constraints, and what a strong learner solution should cover.",
  },
  {
    title: "3. Save public and hidden checks",
    description: "Keep visible examples for guidance and hidden cases for final evaluation.",
  },
  {
    title: "4. Run the current draft",
    description: "Judge0 languages compile through the local runner. SQL and MongoDB run through secure backend sandboxes.",
  },
]

function getExecutionBadge(language: CompilerLanguage | null) {
  if (!language) {
    return "Select a language"
  }

  if (language.engine === "judge0") {
    return "Judge0 compiler"
  }

  if (language.engine === "sql") {
    return "SQL sandbox"
  }

  return "MongoDB sandbox"
}

function getExecutionHint(language: CompilerLanguage | null) {
  if (!language) {
    return "Choose a language to load the matching starter template and execution workflow."
  }

  if (language.engine === "judge0") {
    return "This language uses your local Judge0 instance. Sample stdin is supported and compile/runtime errors return in the error panel."
  }

  if (language.engine === "sql") {
    return "SQL runs inside a guarded transaction sandbox. Destructive statements are blocked, so use setup plus SELECT-style verification queries."
  }

  return "MongoDB runs through a read-only native driver path. Supported methods include find, findOne, aggregate, countDocuments, and distinct."
}

function getRunButtonLabel(language: CompilerLanguage | null, running: boolean) {
  if (running) {
    return "Running locally..."
  }

  if (!language) {
    return "Run current draft"
  }

  if (language.engine === "sql") {
    return "Run SQL query"
  }

  if (language.engine === "mongodb") {
    return "Run MongoDB query"
  }

  return "Run current code locally"
}

export function CodingEditor({ languages, onChange, onExecute, value }: CodingEditorProps) {
  const [result, setResult] = useState<CodeExecutionResult | null>(null)
  const [running, setRunning] = useState(false)
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>({})

  const selectedLanguage = useMemo(
    () =>
      findCompilerLanguage(languages, {
        languageId: value.languageId,
        languageKey: value.languageKey,
        languageName: value.languageName,
      }),
    [languages, value.languageId, value.languageKey, value.languageName],
  )

  useEffect(() => {
    if (selectedLanguage || languages.length === 0) {
      return
    }

    const defaultLanguage = languages.find((language) => language.key === "python") || languages[0]

    onChange({
      ...value,
      languageEngine: defaultLanguage.engine,
      languageId: defaultLanguage.judge0Id,
      languageKey: defaultLanguage.key,
      languageName: defaultLanguage.name,
      starterCode: value.starterCode.trim()
        ? value.starterCode
        : defaultLanguage.starterCode || getStarterTemplateForLanguage(defaultLanguage.key, defaultLanguage.name),
    })
  }, [languages, onChange, selectedLanguage, value])

  useEffect(() => {
    if (!selectedLanguage) {
      return
    }

    setCodeByLanguage((current) => {
      if (current[selectedLanguage.key] === value.starterCode) {
        return current
      }

      return {
        ...current,
        [selectedLanguage.key]: value.starterCode,
      }
    })
  }, [selectedLanguage, value.starterCode])

  const handleLanguageChange = (nextLanguageKey: string) => {
    const nextLanguage = languages.find((language) => language.key === nextLanguageKey)
    if (!nextLanguage) {
      return
    }

    const currentKey = selectedLanguage?.key || value.languageKey
    const nextCodeByLanguage = {
      ...codeByLanguage,
      ...(currentKey ? { [currentKey]: value.starterCode } : {}),
    }
    const nextStarterCode =
      nextCodeByLanguage[nextLanguage.key] ||
      nextLanguage.starterCode ||
      getStarterTemplateForLanguage(nextLanguage.key, nextLanguage.name)

    setCodeByLanguage({
      ...nextCodeByLanguage,
      [nextLanguage.key]: nextStarterCode,
    })
    setResult(null)

    onChange({
      ...value,
      languageEngine: nextLanguage.engine,
      languageId: nextLanguage.judge0Id,
      languageKey: nextLanguage.key,
      languageName: nextLanguage.name,
      starterCode: nextStarterCode,
    })
  }

  const handleRun = async () => {
    if (!selectedLanguage) {
      return
    }

    try {
      setRunning(true)
      const executionResult = await onExecute({
        languageId: selectedLanguage.judge0Id,
        languageKey: selectedLanguage.key,
        languageName: selectedLanguage.name,
        sourceCode: value.starterCode,
        stdin: selectedLanguage.engine === "judge0" ? value.executionInput || undefined : undefined,
        expectedOutput: value.expectedOutput || undefined,
      })
      setResult(executionResult)
    } catch (error) {
      setResult({
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unable to execute the current draft.",
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,18,33,0.98),rgba(11,10,22,0.96))] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Multi-language builder
            </p>
            <h3 className="text-xl font-semibold text-white">Configure the activity and run it in the right engine</h3>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Programming languages compile through Judge0, SQL runs in a guarded query sandbox,
              and MongoDB runs in a read-only query mode. The UI changes automatically based on your selection.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-fuchsia-100">
            <WandSparkles size={14} />
            {getExecutionBadge(selectedLanguage)}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {BUILD_STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-sm font-medium text-white">{step.title}</p>
              <p className="mt-2 text-xs leading-6 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 1</p>
            <h4 className="mt-2 text-lg font-semibold text-white">Choose the language or query mode</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Each option loads its own starter template and preserves edits when you switch away and back.
            </p>

            <label className="mt-4 block space-y-2">
              <span className="text-sm text-white">Language</span>
              <select
                value={selectedLanguage?.key || ""}
                onChange={(event) => handleLanguageChange(event.target.value)}
                className="input-ui"
              >
                {languages.length > 0 ? (
                  languages.map((language) => (
                    <option key={language.key} value={language.key}>
                      {language.name}
                    </option>
                  ))
                ) : (
                  <option value="">No languages available</option>
                )}
              </select>
            </label>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
                  {selectedLanguage?.engine === "sql" ? (
                    <Database size={18} />
                  ) : selectedLanguage?.engine === "mongodb" ? (
                    <ServerCog size={18} />
                  ) : (
                    <SquareTerminal size={18} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedLanguage?.name || "Language details"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedLanguage?.description || "Pick a language to load the matching editor experience."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 2</p>
            <h4 className="mt-2 text-lg font-semibold text-white">Describe what the learner should do</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Keep this practical. Mention the goal, input or query expectations, and edge cases learners should consider.
            </p>

            <textarea
              value={value.instructions}
              onChange={(event) =>
                onChange({
                  ...value,
                  instructions: event.target.value,
                })
              }
              className="mt-4 min-h-40 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
              placeholder="Example: Query the users table and return only active learners ordered by signup date."
            />
          </section>

          <section className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
                <CircleHelp size={18} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Execution behavior</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {getExecutionHint(selectedLanguage)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#090612] shadow-[0_24px_60px_rgba(5,3,10,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(180deg,rgba(21,16,35,0.98),rgba(10,8,19,0.96))] px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Starter template editor</p>
              <p className="mt-1 text-sm text-white">
                This is the initial code or query the learner opens first
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-400">
              {selectedLanguage?.name || "Choose a language"}
            </div>
          </div>

          <Editor
            height="520px"
            language={getMonacoLanguage(value.languageName, value.languageKey)}
            theme="vs-dark"
            value={value.starterCode}
            onChange={(nextValue) => {
              const code = nextValue || ""
              const currentKey = selectedLanguage?.key || value.languageKey

              setCodeByLanguage((current) =>
                currentKey
                  ? {
                      ...current,
                      [currentKey]: code,
                    }
                  : current,
              )

              onChange({
                ...value,
                starterCode: code,
              })
            }}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16, bottom: 16 },
              roundedSelection: true,
              scrollBeyondLastLine: false,
            }}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
              <ListChecks size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 3</p>
              <h4 className="mt-1 text-lg font-semibold text-white">Save the visible and hidden checks</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add public examples for the learner and hidden cases for final validation.
              </p>
            </div>
          </div>

          <TestCaseManager
            testCases={value.testCases}
            onChange={(testCases) => onChange({ ...value, testCases })}
            inputPlaceholder={
              selectedLanguage?.engine === "judge0"
                ? "Standard input for this test case"
                : "Use this field for a human-readable case note or expected scenario"
            }
          />
        </section>

        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#090612]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
                <SquareTerminal size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 4</p>
                <h4 className="mt-1 text-lg font-semibold text-white">Run the current draft</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Test the live template before saving so the learner starts from a clean, working base.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5 text-sm">
            {selectedLanguage?.engine === "judge0" ? (
              <label className="block space-y-2">
                <span className="text-sm text-white">Sample stdin for this local run</span>
                <textarea
                  value={value.executionInput}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      executionInput: event.target.value,
                    })
                  }
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#120D20] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
                  placeholder="Optional stdin for the local preview run"
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#120D20] p-4 text-sm leading-6 text-slate-300">
                {selectedLanguage?.engine === "sql"
                  ? "SQL runs ignore stdin and execute the query text directly inside the backend sandbox."
                  : "MongoDB runs ignore stdin and execute the db.collection.method(...) query directly through the backend sandbox."}
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm text-white">Expected output for the preview</span>
              <textarea
                value={value.expectedOutput}
                onChange={(event) =>
                  onChange({
                    ...value,
                    expectedOutput: event.target.value,
                  })
                }
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#120D20] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
                placeholder="Optional expected output for admin reference"
              />
            </label>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={!selectedLanguage || running}
              onClick={() => void handleRun()}
            >
              <Play size={16} />
              {getRunButtonLabel(selectedLanguage, running)}
            </Button>

            <div
              className={[
                "rounded-2xl border p-4",
                result
                  ? result.success
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-rose-500/20 bg-rose-500/10"
                  : "border-white/10 bg-[#120D20]",
              ].join(" ")}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Run status</p>
              <p className="mt-2 text-white">
                {result?.status || "No run yet."}
              </p>
              {(result?.time || result?.memory) && (
                <p className="mt-2 text-xs text-slate-400">
                  Time: {result.time || "n/a"} | Memory: {result.memory ?? "n/a"}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#120D20] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Output</p>
              <pre className="mt-3 whitespace-pre-wrap break-words text-slate-200">
                {result?.output || "Execution output will appear here after a run."}
              </pre>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#120D20] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Error</p>
              <pre className="mt-3 whitespace-pre-wrap break-words text-slate-300">
                {result?.error || "Compile, runtime, SQL, or MongoDB errors will appear here."}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
