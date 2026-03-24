import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-800/90 text-slate-100",
        secondary: "border-slate-700 bg-slate-900/70 text-slate-200",
        outline: "border-slate-700 bg-transparent text-slate-200",
        beginner: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
        intermediate: "border-orange-500/20 bg-orange-500/10 text-orange-100",
        advanced: "border-red-500/20 bg-red-500/10 text-red-100",
        info: "border-cyan-500/20 bg-cyan-500/10 text-cyan-100",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
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
