"use client"

import { Check, Palette } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useMounted } from "@/hooks/use-mounted"
import { APP_THEMES } from "./ThemeProvider"
import { useAppTheme } from "./ThemeProvider"

export default function ThemeSwitcher() {
  const { setTheme, theme } = useAppTheme()
  const mounted = useMounted()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const activeTheme = mounted ? APP_THEMES.find((option) => option.id === theme) : null

  return (
    <div ref={containerRef} className="theme-switcher">
      {open ? (
        <div className="theme-switcher-panel">
          <div className="theme-switcher-heading">
            <p className="theme-switcher-title">Theme</p>
            <p className="theme-switcher-copy">Choose the AlgoAliens look and feel.</p>
          </div>

          <div className="theme-switcher-options">
            {APP_THEMES.map((option) => {
              const active = option.id === theme

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id)
                    setOpen(false)
                  }}
                  className={`theme-switcher-option ${active ? "theme-switcher-option-active" : ""}`}
                >
                  <span className="theme-switcher-option-copy">
                    <span className="theme-switcher-option-label">{option.label}</span>
                    <span className="theme-switcher-option-description">{option.description}</span>
                  </span>
                  {active ? <Check size={16} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="theme-switcher-toggle"
        aria-expanded={open}
        aria-label="Open theme switcher"
      >
        <Palette size={16} />
        <span>{mounted ? activeTheme?.label || "Theme" : "Theme"}</span>
      </button>
    </div>
  )
}
