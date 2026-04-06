"use client"

import {
  Braces,
  DatabaseZap,
  FileSearch,
  HelpCircle,
} from "lucide-react"
import type { ModuleActivityType } from "@/lib/module-activities"

type ActivityTypeSelectorProps = {
  onChange: (value: ModuleActivityType) => void
  value: ModuleActivityType
}

const ACTIVITY_OPTIONS: Array<{
  description: string
  icon: typeof Braces
  title: string
  value: ModuleActivityType
}> = [
  {
    title: "Coding",
    value: "coding",
    icon: Braces,
    description: "Launch the local compiler with syntax highlighting, starter code, and execution.",
  },
  {
    title: "SQL Debugging",
    value: "sql_debugging",
    icon: DatabaseZap,
    description: "Build a database task with schema SQL, a buggy query, and expected results.",
  },
  {
    title: "Analysis",
    value: "analysis",
    icon: FileSearch,
    description: "Capture long-form prompts, answer guidance, and evaluation rubric.",
  },
  {
    title: "Quiz",
    value: "quiz",
    icon: HelpCircle,
    description: "Manage MCQs with explanations and a clear correct-answer mapping.",
  },
]

export function ActivityTypeSelector({ onChange, value }: ActivityTypeSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {ACTIVITY_OPTIONS.map((option) => {
        const Icon = option.icon
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-[24px] border p-4 text-left transition-all duration-200",
              active
                ? "border-fuchsia-400/40 bg-[linear-gradient(180deg,rgba(73,16,126,0.4),rgba(22,18,43,0.95))] shadow-[0_22px_45px_rgba(76,29,149,0.24)]"
                : "border-white/10 bg-[linear-gradient(180deg,rgba(16,20,30,0.96),rgba(23,16,34,0.92))] hover:border-violet-400/20 hover:bg-[linear-gradient(180deg,rgba(22,24,38,0.98),rgba(30,18,42,0.94))]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{option.title}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-violet-200/70">
                  {active ? "Selected" : "Switch editor"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{option.description}</p>
          </button>
        )
      })}
    </div>
  )
}
