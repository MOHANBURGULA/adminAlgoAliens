"use client"

import { motion } from "framer-motion"

type ReadingProgressBarProps = {
  percentage: number
  theme: "dark" | "light"
}

export function ReadingProgressBar({ percentage, theme }: ReadingProgressBarProps) {
  return (
    <div
      className={[
        "sticky top-0 z-40 h-1 w-full overflow-hidden",
        theme === "dark" ? "bg-white/5" : "bg-slate-200/80",
      ].join(" ")}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-400"
        animate={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  )
}
