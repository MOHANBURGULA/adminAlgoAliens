"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import type { EnrollmentTrendPoint } from "@/lib/admin-dashboard"

type TrendLineChartProps = {
  data: EnrollmentTrendPoint[]
}

function formatTooltipValue(
  value: number | string | ReadonlyArray<number | string> | undefined,
) {
  if (Array.isArray(value)) {
    return value.join(" - ")
  }

  return `${value ?? 0}`
}

export default function TrendLineChart({ data }: TrendLineChartProps) {
  return (
    <section className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-4 shadow-lg shadow-black/20 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Enrollment Trends</h2>
        <p className="mt-2 text-sm text-gray-400">
          Daily enrollment volume based on recorded enrollment timestamps.
        </p>
      </div>

      <div className="mt-6 h-80">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(168, 85, 247, 0.14)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [formatTooltipValue(value), "Enrollments"]}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: "#12092A",
                  border: "1px solid rgba(168, 85, 247, 0.25)",
                  borderRadius: "16px",
                }}
                itemStyle={{ color: "#F5F3FF" }}
                labelStyle={{ color: "#D1D5DB" }}
              />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#22D3EE"
                strokeWidth={3}
                dot={{ r: 4, fill: "#A855F7", stroke: "#22D3EE", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#22D3EE", stroke: "#E9D5FF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-purple-900/40 bg-[#12092A] px-6 text-center text-sm text-gray-400">
            Enrollment timestamps are required before the trend chart can be plotted.
          </div>
        )}
      </div>
    </section>
  )
}
