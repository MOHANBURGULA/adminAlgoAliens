import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "theme-button-primary hover:scale-[1.02]",
        primary: "theme-button-primary hover:scale-[1.02]",
        secondary: "theme-button-secondary hover:scale-[1.02]",
        danger: "theme-button-danger hover:scale-[1.02]",
        destructive: "theme-button-danger hover:scale-[1.02]",
        outline: "theme-button-secondary hover:scale-[1.02]",
        ghost: "theme-button-ghost hover:scale-[1.02]",
        link: "theme-button-link rounded-none px-0 py-0 hover:underline",
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
