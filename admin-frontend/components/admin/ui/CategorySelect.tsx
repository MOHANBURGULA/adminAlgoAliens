"use client"

import { ChevronDown } from "lucide-react"
import type { AdminCategoryRecord } from "@/lib/admin-panel"

type CategorySelectProps = {
  categories: AdminCategoryRecord[]
  label?: string
  allLabel?: string
  value: string
  onChange: (value: string) => void
}

export default function CategorySelect({
  categories,
  label,
  allLabel = "All categories",
  value,
  onChange,
}: CategorySelectProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-teal-400/20 bg-[#05070d] px-4 pr-11 text-sm text-white shadow-[0_0_0_1px_rgba(45,212,191,0.05)] outline-none transition hover:border-teal-300/40 focus:border-teal-300"
        >
          <option value="all">{allLabel}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  )
}
