import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.06] text-slate-100",
        secondary: "border-purple-400/15 bg-purple-500/10 text-purple-100",
        outline: "border-purple-500/20 bg-transparent text-purple-100",
        beginner: "border-violet-400/20 bg-violet-500/10 text-violet-100",
        intermediate: "border-purple-400/20 bg-purple-500/10 text-purple-100",
        advanced: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100",
        info: "border-indigo-400/20 bg-indigo-500/10 text-indigo-100",
        success: "border-violet-400/20 bg-violet-500/10 text-violet-100",
        warning: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100",
        neutral: "border-slate-500/20 bg-slate-500/10 text-slate-200",
        danger: "border-red-500/20 bg-red-500/10 text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
