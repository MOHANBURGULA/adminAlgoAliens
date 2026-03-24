import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ChartCardProps = {
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  description: string
  title: string
}

export function ChartCard({
  action,
  children,
  className,
  contentClassName,
  description,
  title,
}: ChartCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-4 border-b border-white/5 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("p-6", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
