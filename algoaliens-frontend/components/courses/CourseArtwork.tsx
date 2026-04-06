"use client"

import Image from "next/image"
import { Layers3 } from "lucide-react"
import { cn } from "@/lib/utils"

type CourseArtworkProps = {
  category: string
  className?: string
  difficultyLabel: string
  moduleCount: number
  title: string
  variant?: "card" | "hero"
}

export default function CourseArtwork({
  category,
  className,
  difficultyLabel,
  moduleCount,
  title,
  variant = "card",
}: CourseArtworkProps) {
  const hero = variant === "hero"

  return (
    <div
      className={cn("relative overflow-hidden", hero ? "aspect-[16/9]" : "aspect-[16/7.2]", className)}
      style={{
        background: "linear-gradient(135deg, var(--accent-magenta), var(--accent-cyan))",
        border: "var(--card-border)",
        borderRadius: hero ? "calc(var(--card-radius) + 1rem)" : "calc(var(--card-radius) + 0.6rem)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, var(--bg-base) 8%, transparent 58%), linear-gradient(0deg, rgba(0,0,0,0) 55%, var(--bg-surface) 100%)",
          opacity: 0.88,
        }}
      />
      <div
        className={cn(
          "absolute rounded-full opacity-55",
          hero ? "-right-10 -top-10 h-32 w-32" : "-right-8 -top-8 h-24 w-24",
        )}
        style={{ background: "var(--silver-gradient)" }}
      />
      <div
        className={cn(
          "absolute rounded-full opacity-30",
          hero ? "-bottom-12 left-6 h-32 w-32" : "-bottom-10 left-5 h-24 w-24",
        )}
        style={{ background: "var(--accent-gradient)" }}
      />

      <div className={cn("relative z-10 flex h-full flex-col justify-between", hero ? "p-6 md:p-8" : "p-4")}>
        <div className="flex items-center justify-between gap-3">
          <span className="theme-chip px-3 py-1 text-xs font-medium">{category}</span>
          <span className="theme-chip theme-chip-secondary px-3 py-1 text-xs font-medium">
            {difficultyLabel}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className={cn(hero ? "max-w-[18rem]" : "max-w-[13rem]")}>
            <p className="text-xs uppercase tracking-[0.18em] text-theme-muted">
              {hero ? "AlgoAliens course" : "Guided learning track"}
            </p>
            {hero ? (
              <h3 className="mt-2 text-2xl font-semibold leading-tight text-theme-main">{title}</h3>
            ) : (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-xs font-medium text-theme-main backdrop-blur-sm">
                <Layers3 size={14} />
                <span>{moduleCount} structured modules</span>
              </div>
            )}
            {hero ? (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-theme-muted">
                <Layers3 size={16} />
                <span>{moduleCount} modules</span>
              </div>
            ) : (
              <p className="mt-3 line-clamp-1 text-sm text-theme-muted">
                Built for focused practice, checkpoints, and cleaner learning flow.
              </p>
            )}
          </div>

          <div
            className={cn(
              "relative overflow-hidden rounded-[calc(var(--card-radius)+0.55rem)]",
              hero ? "h-24 w-24" : "h-14 w-14",
            )}
            style={{
              background: "var(--bg-surface)",
              border: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <Image
              src="/algoaliens-official-logo.jpeg"
              alt="AlgoAliens official course logo"
              fill
              className="object-cover"
              sizes={hero ? "96px" : "56px"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
