import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StatsCardProps = {
  label: string
  value: number | string
  icon: LucideIcon
  hint?: string
  className?: string
  accentClassName?: string
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
  accentClassName,
}: StatsCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_38%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,15,26,0.96))] p-6 shadow-[0_22px_50px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-[1.01] hover:border-slate-700",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
          {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
        </div>

        <div
          className={cn(
            "rounded-2xl border border-slate-800 bg-white/[0.03] p-3 text-indigo-100",
            accentClassName,
          )}
        >
          <Icon size={22} />
        </div>
      </div>
    </article>
  )
}
