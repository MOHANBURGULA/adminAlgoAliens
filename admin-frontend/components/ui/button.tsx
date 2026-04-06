import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/30 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-[0_16px_40px_rgba(192,132,252,0.24)] hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_22px_44px_rgba(217,70,239,0.28)] hover:ring-1 hover:ring-fuchsia-300/35",
        primary:
          "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-[0_16px_40px_rgba(192,132,252,0.24)] hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_22px_44px_rgba(217,70,239,0.28)] hover:ring-1 hover:ring-fuchsia-300/35",
        secondary:
          "border border-violet-400/30 bg-transparent text-white hover:-translate-y-0.5 hover:scale-[1.02] hover:border-fuchsia-400/45 hover:bg-gradient-to-r hover:from-violet-500/12 hover:to-fuchsia-500/12 hover:shadow-[0_16px_32px_rgba(139,92,246,0.14)]",
        danger:
          "border border-red-500/20 bg-red-500/12 text-red-100 hover:scale-[1.02] hover:bg-red-500/20",
        destructive:
          "border border-red-500/20 bg-red-500/12 text-red-100 hover:scale-[1.02] hover:bg-red-500/20",
        outline:
          "border border-violet-400/30 bg-transparent text-white hover:-translate-y-0.5 hover:scale-[1.02] hover:border-fuchsia-400/45 hover:bg-gradient-to-r hover:from-violet-500/12 hover:to-fuchsia-500/12 hover:shadow-[0_16px_32px_rgba(139,92,246,0.14)]",
        ghost:
          "bg-transparent text-slate-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/[0.05] hover:text-white",
        link: "rounded-none px-0 py-0 text-fuchsia-200 hover:text-white hover:underline",
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
