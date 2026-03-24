import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ChartCardProps = {
  title: string
  description: string
  action?: ReactNode
  className?: string
  chartClassName?: string
  children: ReactNode
}

export default function ChartCard({
  title,
  description,
  action,
  className,
  chartClassName,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("rounded-2xl p-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn("mt-6 h-[280px] w-full", chartClassName)}>{children}</div>
    </Card>
  )
}
