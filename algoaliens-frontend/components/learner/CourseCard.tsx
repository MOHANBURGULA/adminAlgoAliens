import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  clampProgress,
  getCourseProgressLabel,
  getCourseProgressStatus,
  getCourseProgressVariant,
  type CourseProgressStatus,
} from "@/lib/course-progress"
import { formatDifficulty, normalizeDifficulty } from "@/lib/learning"
import { cn } from "@/lib/utils"
import { ProgressBar } from "./ProgressBar"

type CourseCardProps = {
  className?: string
  courseId: number | string
  description?: string
  difficulty?: string
  footer?: React.ReactNode
  highlight?: boolean
  metadata?: React.ReactNode
  progress?: number | null
  status?: CourseProgressStatus
  supplementaryBadge?: React.ReactNode
  title: string
}

function getDifficultyVariant(difficulty?: string) {
  const normalized = normalizeDifficulty(difficulty)

  if (normalized === "advanced") {
    return "advanced" as const
  }

  if (normalized === "intermediate") {
    return "intermediate" as const
  }

  return "beginner" as const
}

export function CourseCard({
  className,
  courseId,
  description,
  difficulty,
  footer,
  highlight = false,
  metadata,
  progress,
  status,
  supplementaryBadge,
  title,
}: CourseCardProps) {
  const normalizedProgress = clampProgress(progress)
  const resolvedStatus = status ?? getCourseProgressStatus(normalizedProgress)

  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-6 p-6",
        highlight &&
          "border-purple-300/25 bg-[linear-gradient(180deg,rgba(51,16,88,0.95),rgba(16,8,30,0.95))] shadow-[0_20px_50px_rgba(46,16,101,0.32)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getDifficultyVariant(difficulty)}>
              {formatDifficulty(difficulty)}
            </Badge>
            <Badge variant={getCourseProgressVariant(resolvedStatus)}>
              {getCourseProgressLabel(resolvedStatus)}
            </Badge>
            {supplementaryBadge}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-purple-200/70">
              Course ID #{courseId}
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight text-white">{title}</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right shadow-inner shadow-black/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completion</p>
          <p className="mt-1 text-2xl font-semibold text-white">{normalizedProgress}%</p>
        </div>
      </div>

      {description ? <p className="text-sm leading-7 text-slate-300">{description}</p> : null}

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <ProgressBar value={normalizedProgress} label="Learning progress" />
      </div>

      {metadata ? (
        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">{metadata}</div>
      ) : null}

      {footer ? <div className="mt-auto flex flex-col gap-3 sm:flex-row">{footer}</div> : null}
    </Card>
  )
}
