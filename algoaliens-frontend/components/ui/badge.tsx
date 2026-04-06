import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
  {
    variants: {
      variant: {
        default: "theme-badge",
        secondary: "theme-badge-accent",
        outline: "theme-badge-outline",
        beginner: "theme-badge-info",
        intermediate: "theme-badge-accent",
        advanced: "theme-badge-warning",
        info: "theme-badge-info",
        success: "theme-badge-success",
        warning: "theme-badge-warning",
        neutral: "theme-badge-neutral",
        danger: "theme-badge-danger",
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
