"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatPercent, type ChartDatum } from "@/lib/admin-dashboard"

type EnrollmentPieChartProps = {
  title: string
  data: ChartDatum[]
  total: number
  description?: string
  completionRate?: number
  emptyMessage?: string
  metrics?: Array<{
    label: string
    value: number | string
  }>
}

export default function EnrollmentPieChart({
  title,
  data,
  total,
  description,
  completionRate,
  emptyMessage,
  metrics,
}: EnrollmentPieChartProps) {
  const hasData = data.some((entry) => entry.value > 0)
  const footerMetrics =
    metrics ??
    [
      { label: "Total", value: total },
      {
        label: "Completion",
        value: completionRate === undefined ? "N/A" : formatPercent(completionRate),
      },
    ]

  const formatTooltipValue = (
    value: number | string | ReadonlyArray<number | string> | undefined,
  ) => {
    if (Array.isArray(value)) {
      return value.join(" - ")
    }

    return `${value ?? 0}`
  }

  return (
    <section className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-4 shadow-lg shadow-black/20 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
        </div>

        <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-gray-300">
          {total} enrollments
        </span>
      </div>

      <div className="mt-6 h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="rgba(6, 2, 13, 0.85)" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatTooltipValue(value), `${name ?? ""}`]}
                contentStyle={{
                  backgroundColor: "#12092A",
                  border: "1px solid rgba(168, 85, 247, 0.25)",
                  borderRadius: "16px",
                }}
                itemStyle={{ color: "#F5F3FF" }}
                labelStyle={{ color: "#D1D5DB" }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ paddingTop: 16, color: "#D1D5DB" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-purple-900/40 bg-[#12092A] px-6 text-center text-sm text-gray-400">
            {emptyMessage ?? "No enrollment activity yet for this course."}
          </div>
        )}
      </div>

      <div
        className="mt-4 grid gap-3 border-t border-purple-900/20 pt-4"
        style={{ gridTemplateColumns: `repeat(${Math.max(footerMetrics.length, 1)}, minmax(0, 1fr))` }}
      >
        {footerMetrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-[#12092A] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-gray-400">{metric.label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
