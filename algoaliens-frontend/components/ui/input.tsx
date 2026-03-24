import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-slate-800 bg-[#0F172A] px-4 py-3 text-sm text-white shadow-none outline-none transition-all duration-200 placeholder:text-slate-500",
        "focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
