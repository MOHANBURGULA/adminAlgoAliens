"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value = 0,
  max = 100,
  ...props
}: React.ComponentProps<"progress">) {
  const normalized = Math.max(0, Math.min(Number(value) || 0, Number(max) || 100))

  return (
    <progress
      data-slot="progress"
      className={cn("ui-progress", className)}
      value={normalized}
      max={max}
      {...props}
    />
  )
}

export { Progress }
