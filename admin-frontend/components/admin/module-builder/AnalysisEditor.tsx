"use client"

import type { AnalysisActivityConfig } from "@/lib/module-activities"

type AnalysisEditorProps = {
  onChange: (value: AnalysisActivityConfig) => void
  value: AnalysisActivityConfig
}

export function AnalysisEditor({ onChange, value }: AnalysisEditorProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Prompt</p>
        <textarea
          value={value.prompt}
          onChange={(event) =>
            onChange({
              ...value,
              prompt: event.target.value,
            })
          }
          placeholder="Write your analysis of the given case study..."
          className="mt-4 min-h-[260px] w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Expected answer guidance</p>
          <textarea
            value={value.guidance}
            onChange={(event) =>
              onChange({
                ...value,
                guidance: event.target.value,
              })
            }
            placeholder="Outline the depth, structure, and insight expected from learners."
            className="mt-4 min-h-40 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
          />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Evaluation rubric</p>
          <textarea
            value={value.rubric}
            onChange={(event) =>
              onChange({
                ...value,
                rubric: event.target.value,
              })
            }
            placeholder="Describe scoring criteria, evaluation notes, and quality expectations."
            className="mt-4 min-h-40 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
          />
        </div>
      </div>
    </div>
  )
}
