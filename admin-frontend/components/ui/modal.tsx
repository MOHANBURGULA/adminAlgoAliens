"use client"

import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type ModalProps = {
  children: ReactNode
  description?: ReactNode
  footer?: ReactNode
  maxWidthClassName?: string
  onClose: () => void
  open: boolean
  title: ReactNode
}

export function Modal({
  children,
  description,
  footer,
  maxWidthClassName = "max-w-lg",
  onClose,
  open,
  title,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,15,26,0.98))] shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
          maxWidthClassName,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-white/[0.03] text-slate-300 transition-all duration-200 hover:scale-105 hover:border-slate-700 hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
