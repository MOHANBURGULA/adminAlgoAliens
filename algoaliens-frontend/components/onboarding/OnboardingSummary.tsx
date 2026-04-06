"use client"

import { CheckCircle2, Clock3, Layers3, Sparkles } from "lucide-react"
import type { OnboardingFormData } from "@/lib/onboarding"

type OnboardingSummaryProps = {
  formData: OnboardingFormData
  currentStep: number
  totalSteps: number
}

function formatBooleanLabel(value: boolean | null) {
  if (value === null) {
    return "Pending"
  }

  return value ? "Yes" : "No"
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "Pending"
}

export function OnboardingSummary({
  formData,
  currentStep,
  totalSteps,
}: OnboardingSummaryProps) {
  const completionPercentage = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <aside
      className="rounded-[2rem] border p-6 lg:p-7"
      style={{
        background: "linear-gradient(180deg, rgba(19, 30, 50, 0.94), rgba(9, 14, 25, 0.98))",
        borderColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "var(--card-shadow-strong)",
      }}
    >
      <div className="flex items-center gap-3 text-theme-main">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--accent-cyan)]">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-theme-muted">Your setup</p>
          <h2 className="mt-1 text-xl font-semibold">Learning profile</h2>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-theme-muted">Progress</p>
            <p className="mt-1 text-2xl font-semibold text-theme-main">{completionPercentage}%</p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-theme-muted">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-cyan),var(--accent-magenta))] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-main">
            <CheckCircle2 size={16} className="text-[var(--accent-cyan)]" />
            Selected path
          </div>
          <div className="mt-3 space-y-3 text-sm text-theme-muted">
            <p>Role: <span className="text-theme-main">{formData.role || "Pending"}</span></p>
            <p>Goal: <span className="text-theme-main">{formData.career_goal || "Pending"}</span></p>
            <p>Domains: <span className="text-theme-main">{formatList(formData.skill_domains)}</span></p>
          </div>
        </div>

        <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-main">
            <Layers3 size={16} className="text-[var(--accent-magenta)]" />
            Learning fit
          </div>
          <div className="mt-3 space-y-3 text-sm text-theme-muted">
            <p>Level: <span className="text-theme-main">{formData.skillLevel || "Pending"}</span></p>
            <p>
              Coding experience: <span className="text-theme-main">{formatBooleanLabel(formData.coding_experience)}</span>
            </p>
          </div>
        </div>

        <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-main">
            <Clock3 size={16} className="text-[var(--accent-cyan)]" />
            Weekly pace
          </div>
          <div className="mt-3 space-y-3 text-sm text-theme-muted">
            <p>Time available: <span className="text-theme-main">{formData.weekly_hours || "Pending"}</span></p>
            <p>Timeline: <span className="text-theme-main">{formData.target_timeline || "Pending"}</span></p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 text-theme-muted">
        Your draft is saved locally while you complete onboarding, so refreshes will not wipe your
        progress.
      </p>
    </aside>
  )
}
