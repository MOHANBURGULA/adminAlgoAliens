"use client"

import { Progress } from "@/components/ui/progress"
import { clampProgress } from "@/lib/course-progress"
import { cn } from "@/lib/utils"

type ProgressBarTone = "primary" | "success" | "warning"

type ProgressBarProps = {
  className?: string
  label?: string
  showValue?: boolean
  tone?: ProgressBarTone
  value?: number | null
}

function getToneClass(tone: ProgressBarTone) {
  if (tone === "success") {
    return "ui-progress-success"
  }

  if (tone === "warning") {
    return "ui-progress-warning"
  }

  return ""
}

export function ProgressBar({
  className,
  label = "Progress",
  showValue = true,
  tone = "primary",
  value,
}: ProgressBarProps) {
  const normalized = clampProgress(value)

  return (
    <div className={cn("space-y-3", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-3 text-sm text-theme-muted">
          <span>{label}</span>
          {showValue ? <span className="font-medium text-theme-main">{normalized}%</span> : null}
        </div>
      )}

      <Progress value={normalized} className={cn("h-3", getToneClass(tone))} />
    </div>
  )
}
