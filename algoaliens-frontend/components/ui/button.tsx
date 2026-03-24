import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.18)] hover:scale-105 hover:shadow-[0_16px_38px_rgba(34,211,238,0.24)]",
        primary:
          "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.18)] hover:scale-105 hover:shadow-[0_16px_38px_rgba(34,211,238,0.24)]",
        secondary:
          "border border-slate-800 bg-[#111827] text-white hover:scale-105 hover:border-slate-700 hover:bg-[#172033]",
        danger:
          "border border-red-500/20 bg-red-500/12 text-red-100 hover:scale-105 hover:bg-red-500/20",
        destructive:
          "border border-red-500/20 bg-red-500/12 text-red-100 hover:scale-105 hover:bg-red-500/20",
        outline:
          "border border-slate-700 bg-transparent text-white hover:scale-105 hover:border-cyan-400/40 hover:bg-cyan-400/8",
        ghost:
          "bg-transparent text-slate-300 hover:scale-105 hover:bg-white/[0.05] hover:text-white",
        link: "rounded-none px-0 py-0 text-cyan-300 hover:text-cyan-200 hover:underline",
      },
      size: {
        default: "min-h-11 px-5 py-3",
        sm: "min-h-10 px-4 py-2.5 text-sm",
        lg: "min-h-12 px-6 py-3.5 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
