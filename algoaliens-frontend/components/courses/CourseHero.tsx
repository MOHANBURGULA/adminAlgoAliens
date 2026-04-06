"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import CourseArtwork from "@/components/courses/CourseArtwork"
import { BookOpen, Clock3 } from "lucide-react"

type CourseHeroProps = {
  category: string
  description: string
  difficultyLabel: string
  durationLabel: string
  moduleCount: number
  primaryAction: {
    href?: string
    label: string
    loading?: boolean
    onClick?: () => void
  }
  secondaryActionHref?: string
  secondaryActionLabel?: string
  subtitle: string
  title: string
}

function ActionButton({
  action,
}: {
  action: CourseHeroProps["primaryAction"]
}) {
  const copy = action.loading ? "Working..." : action.label

  if (action.href) {
    return (
      <Link href={action.href} className="theme-button-primary inline-flex px-5 py-3 text-sm font-medium">
        {copy}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.loading}
      className="theme-button-primary inline-flex px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
    >
      {copy}
    </button>
  )
}

export default function CourseHero({
  category,
  description,
  difficultyLabel,
  durationLabel,
  moduleCount,
  primaryAction,
  secondaryActionHref,
  secondaryActionLabel,
  subtitle,
  title,
}: CourseHeroProps) {
  return (
    <section
      className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.2fr_0.8fr]"
      style={{
        border: "var(--card-border)",
        borderRadius: "calc(var(--card-radius) + 1rem)",
        background: "var(--panel-background)",
        boxShadow: "var(--card-shadow-strong)",
        backdropFilter: "var(--glass-filter)",
      }}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{difficultyLabel}</Badge>
            <Badge variant="info">{category}</Badge>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-theme-muted">Course overview</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-theme-main">{title}</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-theme-muted">{subtitle}</p>
          </div>

          <p className="max-w-3xl text-base leading-8 text-theme-muted">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-theme-muted">
          <span className="inline-flex items-center gap-2">
            <Clock3 size={16} className="text-[var(--accent-cyan)]" />
            <span>{durationLabel}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <BookOpen size={16} className="text-[var(--accent-magenta)]" />
            <span>{moduleCount} modules</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton action={primaryAction} />
          {secondaryActionHref && secondaryActionLabel ? (
            <Link href={secondaryActionHref} className="theme-outline-link px-5 py-3 text-sm font-medium">
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <CourseArtwork
          variant="hero"
          category={category}
          difficultyLabel={difficultyLabel}
          moduleCount={moduleCount}
          title={title}
        />
      </div>
    </section>
  )
}
