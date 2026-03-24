import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-purple-500/20 bg-[rgba(20,10,36,0.9)] px-4 py-3 text-sm text-white shadow-none outline-none transition-all duration-300 placeholder:text-slate-500",
        "focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
