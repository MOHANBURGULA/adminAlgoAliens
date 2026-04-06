"use client"

import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/admin/ui/Button"
import { createEmptyTestCase, type ActivityTestCase } from "@/lib/module-activities"

type TestCaseManagerProps = {
  addLabel?: string
  inputLabel?: string
  inputPlaceholder?: string
  onChange: (value: ActivityTestCase[]) => void
  testCases: ActivityTestCase[]
}

export function TestCaseManager({
  addLabel = "Add test case",
  inputLabel = "Input",
  inputPlaceholder = "Sample input",
  onChange,
  testCases,
}: TestCaseManagerProps) {
  const updateCase = (caseId: string, key: keyof ActivityTestCase, nextValue: string | boolean) => {
    onChange(
      testCases.map((testCase) =>
        testCase.id === caseId ? { ...testCase, [key]: nextValue } : testCase,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Test cases</h3>
          <p className="mt-1 text-xs text-slate-400">
            Separate public and hidden checks so admins can preview the learner experience.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...testCases, createEmptyTestCase()])}
        >
          <Plus size={14} />
          {addLabel}
        </Button>
      </div>

      <div className="space-y-3">
        {testCases.map((testCase, index) => (
          <div
            key={testCase.id}
            className="rounded-[24px] border border-white/10 bg-[#120D20]/90 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Case {index + 1}</p>
                <p className="text-xs text-slate-400">
                  {testCase.isHidden ? "Hidden evaluation case" : "Visible learner case"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(testCases.filter((entry) => entry.id !== testCase.id))}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/10"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  {inputLabel}
                </label>
                <textarea
                  value={testCase.input}
                  onChange={(event) => updateCase(testCase.id, "input", event.target.value)}
                  placeholder={inputPlaceholder}
                  className="min-h-32 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Expected output
                </label>
                <textarea
                  value={testCase.expectedOutput}
                  onChange={(event) =>
                    updateCase(testCase.id, "expectedOutput", event.target.value)
                  }
                  placeholder="Expected output or verification snapshot"
                  className="min-h-32 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <textarea
                value={testCase.explanation}
                onChange={(event) => updateCase(testCase.id, "explanation", event.target.value)}
                placeholder="Optional explanation or grader note"
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
              />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={testCase.isHidden}
                  onChange={(event) => updateCase(testCase.id, "isHidden", event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                Hidden test case
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
