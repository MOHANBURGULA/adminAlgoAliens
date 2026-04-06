import { cn } from "@/lib/utils"
import type { BadgeTone } from "@/lib/admin-panel"

const badgeToneClasses: Record<BadgeTone, string> = {
  indigo: "border-indigo-500/20 bg-indigo-500/12 text-indigo-100",
  purple: "border-violet-500/20 bg-violet-500/12 text-violet-100",
  green: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
  red: "border-rose-500/20 bg-rose-500/12 text-rose-100",
  yellow: "border-orange-500/20 bg-orange-500/12 text-orange-100",
  slate: "border-slate-700 bg-slate-800/70 text-slate-200",
}

export function badgeStyles(tone: BadgeTone, className?: string) {
  return cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.16em] uppercase",
    badgeToneClasses[tone],
    className,
  )
}

type BadgeProps = {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}

export default function Badge({ children, tone = "slate", className }: BadgeProps) {
  return <span className={badgeStyles(tone, className)}>{children}</span>
}
