import { clampPercentage, formatPercent } from "@/lib/admin-dashboard"
import { cn } from "@/lib/utils"

type ProgressBarProps = {
  value: number
  label?: string
  className?: string
  trackClassName?: string
  barClassName?: string
  showValue?: boolean
}

export default function ProgressBar({
  value,
  label,
  className,
  trackClassName,
  barClassName,
  showValue = true,
}: ProgressBarProps) {
  const percentage = clampPercentage(value)

  return (
    <div className={cn("space-y-2", className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-300">{label ?? "Progress"}</span>
          {showValue ? <span className="font-medium text-white">{formatPercent(percentage)}</span> : null}
        </div>
      ) : null}

      <div className={cn("h-2.5 overflow-hidden rounded-full bg-[#140A2A]", trackClassName)}>
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-800 transition-[width] duration-500",
            barClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
