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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "var(--glass-filter)",
        background: "var(--overlay-background)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full",
          maxWidthClassName,
        )}
        style={{
          backdropFilter: "var(--glass-filter)",
          background: "var(--panel-background)",
          border: "var(--card-border)",
          borderRadius: "calc(var(--card-radius) + 1rem)",
          boxShadow: "var(--card-shadow-strong)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 px-6 py-5"
          style={{ borderBottom: "var(--card-border)" }}
        >
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-theme-main">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-theme-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-button-ghost inline-flex h-10 w-10 items-center justify-center"
            style={{ border: "var(--card-border)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div
            className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:justify-end"
            style={{ borderTop: "var(--card-border)" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
