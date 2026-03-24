import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "outline" | "success" | "danger" | "ghost"
type ButtonSize = "sm" | "md"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.18)] hover:shadow-[0_16px_36px_rgba(34,211,238,0.22)]",
  secondary: "border border-slate-800 bg-[#111827] text-white hover:border-slate-700 hover:bg-[#172033]",
  outline:
    "border border-slate-700 bg-transparent text-white hover:border-cyan-400/30 hover:bg-cyan-400/10",
  success: "border border-emerald-500/20 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20",
  danger: "border border-rose-500/20 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20",
  ghost: "bg-white/[0.04] text-gray-200 hover:bg-white/[0.08] hover:text-white",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-4.5 py-2.5 text-sm",
}

export function buttonStyles({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export default function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return <button className={buttonStyles({ variant, size, className })} {...props} />
}
