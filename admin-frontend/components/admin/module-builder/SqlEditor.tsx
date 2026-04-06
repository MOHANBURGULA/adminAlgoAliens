"use client"

import Editor from "@monaco-editor/react"
import { Database, FlaskConical } from "lucide-react"
import type { SqlDebuggingActivityConfig } from "@/lib/module-activities"
import { TestCaseManager } from "./TestCaseManager"

type SqlEditorProps = {
  onChange: (value: SqlDebuggingActivityConfig) => void
  value: SqlDebuggingActivityConfig
}

export function SqlEditor({ onChange, value }: SqlEditorProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
              <Database size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">SQL playground brief</p>
              <p className="text-xs text-slate-400">Set the task, result target, and internal notes.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <textarea
              value={value.problemDescription}
              onChange={(event) =>
                onChange({
                  ...value,
                  problemDescription: event.target.value,
                })
              }
              placeholder="Describe the SQL debugging objective and what the learner should fix."
              className="min-h-36 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
            />

            <textarea
              value={value.expectedOutput}
              onChange={(event) =>
                onChange({
                  ...value,
                  expectedOutput: event.target.value,
                })
              }
              placeholder="Expected rows or output snapshot"
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
            />

            <textarea
              value={value.hiddenNotes}
              onChange={(event) =>
                onChange({
                  ...value,
                  hiddenNotes: event.target.value,
                })
              }
              placeholder="Optional grader notes or hidden edge-case hints"
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#090612]">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Schema / setup SQL</p>
              <p className="mt-1 text-sm text-white">Tables, sample rows, and environment setup</p>
            </div>
            <Editor
              height="250px"
              language="sql"
              theme="vs-dark"
              value={value.schema}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  schema: nextValue || "",
                })
              }
              options={{
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#090612]">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Buggy or starter query</p>
              <p className="mt-1 text-sm text-white">The learner-facing SQL editor starts here</p>
            </div>
            <Editor
              height="300px"
              language="sql"
              theme="vs-dark"
              value={value.starterQuery}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  starterQuery: nextValue || "",
                })
              }
              options={{
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
          <TestCaseManager
            testCases={value.testCases}
            onChange={(testCases) => onChange({ ...value, testCases })}
            inputLabel="Assertion query / input"
            inputPlaceholder="Optional verification query or edge-case setup"
            addLabel="Add SQL case"
          />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
              <FlaskConical size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Execution panel</p>
              <p className="text-xs text-slate-400">Structured and ready for a local SQL runner.</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-dashed border-fuchsia-400/20 bg-[#090612] p-4">
            <p className="text-sm text-white">Local SQL execution is not connected yet.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The full SQL payload, schema editor, starter query, and test-case structure are saved now,
              so the runtime hook can be attached later without redesigning the admin builder.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
