"use client"

import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ChoiceCardProps = {
  title: string
  description: string
  selected: boolean
  onClick: () => void
  icon: LucideIcon
  disabled?: boolean
}

export function ChoiceCard({
  title,
  description,
  selected,
  onClick,
  icon: Icon,
  disabled = false,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-40 w-full flex-col rounded-[1.4rem] border p-5 text-left transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-transparent bg-[linear-gradient(180deg,rgba(44,226,208,0.18),rgba(184,41,168,0.16))] shadow-[0_22px_48px_rgba(3,8,20,0.32)]"
          : "border-white/10 bg-white/5 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_18px_40px_rgba(3,8,20,0.24)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[var(--accent-cyan)] transition-colors duration-300 group-hover:text-white">
          <Icon size={22} />
        </div>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border text-transparent transition-all duration-300",
            selected
              ? "border-transparent bg-white text-[#0b1120]"
              : "border-white/15 bg-white/5 text-transparent",
          )}
        >
          <Check size={16} />
        </span>
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-lg font-semibold text-theme-main">{title}</h3>
        <p className="text-sm leading-7 text-theme-muted">{description}</p>
      </div>
    </button>
  )
}
