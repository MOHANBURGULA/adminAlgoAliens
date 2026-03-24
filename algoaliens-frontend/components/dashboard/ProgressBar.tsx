import { cn } from "@/lib/utils"

const WIDTH_BY_PERCENT: Record<number, string> = {
  0: "w-0",
  5: "w-[5%]",
  10: "w-[10%]",
  15: "w-[15%]",
  20: "w-[20%]",
  25: "w-[25%]",
  30: "w-[30%]",
  35: "w-[35%]",
  40: "w-[40%]",
  45: "w-[45%]",
  50: "w-[50%]",
  55: "w-[55%]",
  60: "w-[60%]",
  65: "w-[65%]",
  70: "w-[70%]",
  75: "w-[75%]",
  80: "w-[80%]",
  85: "w-[85%]",
  90: "w-[90%]",
  95: "w-[95%]",
  100: "w-full",
}

function getWidthClass(value: number) {
  const normalized = Math.min(100, Math.max(0, Math.round(value / 5) * 5))
  return WIDTH_BY_PERCENT[normalized] || "w-0"
}

function getToneClass(tone: "primary" | "success" | "warning" | "neutral") {
  if (tone === "success") {
    return "from-violet-500 to-purple-700"
  }

  if (tone === "warning") {
    return "from-fuchsia-500 to-purple-700"
  }

  if (tone === "neutral") {
    return "from-slate-500 to-slate-400"
  }

  return "from-purple-600 to-purple-800"
}

type ProgressBarProps = {
  value: number
  label?: string
  showValue?: boolean
  tone?: "primary" | "success" | "warning" | "neutral"
  className?: string
}

export default function ProgressBar({
  value,
  label,
  showValue = true,
  tone = "primary",
  className,
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div className={cn("space-y-2", className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
          <span>{label || "Progress"}</span>
          {showValue ? <span className="font-medium text-white">{safeValue}%</span> : null}
        </div>
      ) : null}

      <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            getToneClass(tone),
            getWidthClass(safeValue),
          )}
        />
      </div>
    </div>
  )
}
