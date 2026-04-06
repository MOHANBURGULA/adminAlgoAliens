"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import CourseArtwork from "@/components/courses/CourseArtwork"
import { BookOpen, Clock3, Star, UserRound, Users } from "lucide-react"
import { clampProgress, getCourseStatus, getCourseStatusVariant, getDifficultyVariant } from "@/lib/course-display"
import { cn } from "@/lib/utils"

type CourseCardAction =
  | {
      href: string
      label: string
    }
  | {
      disabled?: boolean
      label: string
      loading?: boolean
      onClick: () => void
    }

type CourseCardProps = {
  category: string
  className?: string
  courseId: number
  description: string
  difficulty: string
  durationLabel: string
  enrolledStudentsLabel: string
  instructorName: string
  moduleCount: number
  primaryAction: CourseCardAction
  progress?: number
  rating: number
  recommended?: boolean
  reviewCount: number
  secondaryAction?: {
    href: string
    label: string
  }
  title: string
}

function PrimaryAction({ action }: { action: CourseCardAction }) {
  if ("href" in action) {
    return (
      <Link href={action.href} className="theme-button-primary inline-flex w-full justify-center px-4 py-2 text-sm font-medium">
        {action.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className="theme-button-primary inline-flex w-full justify-center px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
    >
      {action.loading ? "Working..." : action.label}
    </button>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 text-theme-muted" />
      <div>
        <p className="text-sm text-theme-muted">{label}</p>
        <p className="mt-1 text-sm font-medium text-theme-main">{value}</p>
      </div>
    </div>
  )
}

export default function CourseCard({
  category,
  className,
  courseId,
  description,
  difficulty,
  durationLabel,
  enrolledStudentsLabel,
  instructorName,
  moduleCount,
  primaryAction,
  progress,
  rating,
  recommended = false,
  reviewCount,
  secondaryAction,
  title,
}: CourseCardProps) {
  const normalizedProgress = clampProgress(progress)
  const showProgress = typeof progress === "number"
  const progressStatus = getCourseStatus(normalizedProgress)

  return (
    <article
      className={cn(
        "theme-card theme-card-interactive flex h-full flex-col gap-4 overflow-hidden p-4 md:p-5",
        recommended && "ring-1 ring-[var(--accent-magenta)]/20",
        className,
      )}
    >
      <CourseArtwork
        category={category}
        difficultyLabel={difficulty}
        moduleCount={moduleCount}
        title={title}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getDifficultyVariant(difficulty)}>{difficulty}</Badge>
          <Badge variant="info">{category}</Badge>
          {recommended ? <Badge variant="secondary">Recommended</Badge> : null}
          {showProgress ? <Badge variant={getCourseStatusVariant(progressStatus)}>{progressStatus}</Badge> : null}
        </div>

        <div
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold text-theme-main"
          style={{ borderColor: "var(--border-color)", background: "var(--subsurface-background)" }}
        >
          <Star size={13} className="text-[var(--accent-magenta)]" />
          <span>{rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">Course #{courseId}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-theme-main">
            {title}
          </h3>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-theme-muted">{description}</p>
      </div>

      <div
        className="grid gap-3 rounded-[calc(var(--card-radius)+0.35rem)] p-3.5 md:grid-cols-2"
        style={{
          border: "var(--card-border)",
          background: "var(--subsurface-background)",
        }}
      >
        <DetailItem icon={Clock3} label="Estimated duration" value={durationLabel} />
        <DetailItem icon={BookOpen} label="Modules" value={`${moduleCount} structured modules`} />
        <DetailItem icon={UserRound} label="Instructor" value={instructorName} />
        <DetailItem icon={Users} label="Students" value={enrolledStudentsLabel} />
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-theme-muted">
        <span className="inline-flex items-center gap-2">
          <Star size={16} className="text-[var(--accent-magenta)]" />
          <span className="font-semibold text-theme-main">{rating.toFixed(1)}</span>
          <span>({reviewCount.toLocaleString()} reviews)</span>
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-theme-muted">
          {showProgress ? "Enrolled" : "Open to enroll"}
        </span>
      </div>

      {showProgress ? (
        <div
          className="rounded-[calc(var(--card-radius)+0.3rem)] p-3.5"
          style={{
            border: "var(--card-border)",
            background: "var(--subsurface-background)",
          }}
        >
          <div className="flex items-center justify-between gap-3 text-sm text-theme-muted">
            <span>Progress</span>
            <span className="font-medium text-theme-main">{normalizedProgress}%</span>
          </div>
          <div className="mt-2.5 h-2 rounded-full" style={{ background: "var(--progress-track)" }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${normalizedProgress}%`,
                background: "var(--progress-fill)",
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-auto grid gap-2.5 sm:grid-cols-2">
        <PrimaryAction action={primaryAction} />
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="theme-outline-link inline-flex w-full justify-center px-4 py-2 text-sm font-medium"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
