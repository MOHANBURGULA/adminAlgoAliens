"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import ProgressBar from "@/components/dashboard/ProgressBar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDifficulty } from "@/lib/learning"
import {
  clampProgress,
  getCourseStatusVariant,
  type CourseStatus,
} from "@/lib/course-display"
import { cn } from "@/lib/utils"

type Action =
  | {
      label: string
      href: string
      disabled?: boolean
    }
  | {
      label: string
      onClick: () => void
      disabled?: boolean
    }

type SecondaryAction = {
  label: string
  href: string
}

type CourseCardProps = {
  title: string
  courseId: number
  difficulty: string
  difficultyVariant: "advanced" | "beginner" | "intermediate"
  description: string
  status?: CourseStatus
  progress?: number
  metaLabel?: string
  metaValue?: string
  recommended?: boolean
  className?: string
  primaryAction: Action
  secondaryAction?: SecondaryAction
  isLoading?: boolean
}

function PrimaryActionButton({
  action,
  isLoading,
}: {
  action: Action
  isLoading?: boolean
}) {
  if ("href" in action) {
    return (
      <Button asChild variant="primary" className="w-full">
        <Link href={action.href}>
          {action.label}
          <ArrowRight size={16} />
        </Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="primary"
      className="w-full"
      onClick={action.onClick}
      disabled={action.disabled || isLoading}
    >
      {isLoading ? "Loading..." : action.label}
      <ArrowRight size={16} />
    </Button>
  )
}

export default function CourseCard({
  title,
  courseId,
  difficulty,
  difficultyVariant,
  description,
  status,
  progress,
  metaLabel,
  metaValue,
  recommended = false,
  className,
  primaryAction,
  secondaryAction,
  isLoading = false,
}: CourseCardProps) {
  const safeProgress = clampProgress(progress)

  return (
    <article
      className={cn(
        "card-ui flex h-full flex-col gap-5 rounded-2xl",
        recommended ? "border-purple-300/30 bg-[rgba(32,18,54,0.94)]" : "",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={difficultyVariant}>{formatDifficulty(difficulty)}</Badge>
          {recommended ? <Badge variant="info">Recommended</Badge> : null}
        </div>

        {status ? <Badge variant={getCourseStatusVariant(status)}>{status}</Badge> : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/80">
          Course ID #{courseId}
        </p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      </div>

      {typeof progress === "number" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ProgressBar
            value={safeProgress}
            label={status ? `${status} progress` : "Completion progress"}
            tone={
              status === "Completed"
                ? "success"
                : status === "In Progress"
                  ? "warning"
                  : "neutral"
            }
          />
        </div>
      ) : null}

      {metaLabel && metaValue ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metaLabel}</p>
          <p className="mt-2 text-sm font-medium text-white">{metaValue}</p>
        </div>
      ) : null}

      <div className="mt-auto grid gap-3 sm:grid-cols-2">
        <PrimaryActionButton action={primaryAction} isLoading={isLoading} />

        {secondaryAction ? (
          <Button asChild variant="secondary" className="w-full">
            <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
        ) : null}
      </div>
    </article>
  )
}
