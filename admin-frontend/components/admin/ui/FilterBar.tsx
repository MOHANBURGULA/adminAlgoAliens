import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type FilterBarProps = {
  children: ReactNode
  summary?: ReactNode
  className?: string
}

export default function FilterBar({ children, summary, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "surface-panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        {children}
      </div>

      {summary ? <div className="text-sm text-slate-400 lg:text-right">{summary}</div> : null}
    </div>
  )
}
