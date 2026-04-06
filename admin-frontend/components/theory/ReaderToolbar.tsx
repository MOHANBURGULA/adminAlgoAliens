"use client"

import {
  ArrowLeft,
  Bookmark,
  Expand,
  Minimize,
  Moon,
  Search,
  SunMedium,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

type ReaderToolbarProps = {
  canMarkCompleted: boolean
  completed: boolean
  currentPageLabel: string
  estimatedReadingTime: number
  isFullscreen: boolean
  onBack: () => void
  onBookmark: () => void
  onMarkCompleted: () => void
  onSearchChange: (value: string) => void
  onToggleFullscreen: () => void
  onToggleTheme: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  progressPercentage: number
  searchEnabled: boolean
  searchQuery: string
  theme: "dark" | "light"
  title: string
  zoom: number
}

export function ReaderToolbar({
  canMarkCompleted,
  completed,
  currentPageLabel,
  estimatedReadingTime,
  isFullscreen,
  onBack,
  onBookmark,
  onMarkCompleted,
  onSearchChange,
  onToggleFullscreen,
  onToggleTheme,
  onZoomIn,
  onZoomOut,
  progressPercentage,
  searchEnabled,
  searchQuery,
  theme,
  title,
  zoom,
}: ReaderToolbarProps) {
  const surfaceClasses =
    theme === "dark"
      ? "border-white/10 bg-[rgba(10,8,18,0.82)] text-white shadow-[0_12px_40px_rgba(0,0,0,0.32)]"
      : "border-slate-200 bg-white/85 text-slate-900 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"

  return (
    <div className="sticky top-1 z-30 px-3 pt-3 sm:px-6">
      <div
        className={[
          "backdrop-blur-xl rounded-[26px] border px-4 py-4",
          surfaceClasses,
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.08]"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {`${currentPageLabel} - ${Math.round(progressPercentage)}% read - ${estimatedReadingTime} min read`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            {searchEnabled ? (
              <label className="relative w-full xl:w-[320px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search inside this theory"
                  className={[
                    "h-11 w-full rounded-2xl border pl-10 pr-4 text-sm outline-none transition",
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-fuchsia-400/30"
                      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-300",
                  ].join(" ")}
                />
              </label>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onZoomOut}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm transition hover:bg-white/[0.08]"
              >
                <ZoomOut size={16} />
                Zoom
              </button>
              <span className="min-w-16 text-center text-sm text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={onZoomIn}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.08]"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={onBookmark}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm transition hover:bg-white/[0.08]"
              >
                <Bookmark size={16} />
                Bookmark
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.08]"
              >
                {theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.08]"
              >
                {isFullscreen ? <Minimize size={16} /> : <Expand size={16} />}
              </button>
              {canMarkCompleted ? (
                <button
                  type="button"
                  onClick={onMarkCompleted}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {completed ? "Completed" : "Mark as Completed"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
