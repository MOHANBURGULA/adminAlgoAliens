"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { formatPercent } from "@/lib/admin-dashboard"

type CompletionBarChartDatum = {
  courseName: string
  completionRate: number
  totalEnrollments: number
}

type CompletionBarChartProps = {
  data: CompletionBarChartDatum[]
}

function truncateLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 14)}...` : value
}

function getNumericTooltipValue(
  value: number | string | ReadonlyArray<number | string> | undefined,
) {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0)
  }

  return Number(value ?? 0)
}

export default function CompletionBarChart({ data }: CompletionBarChartProps) {
  return (
    <section className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-4 shadow-lg shadow-black/20 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Completion Rate by Course</h2>
        <p className="mt-2 text-sm text-gray-400">
          Compare the percentage of learners who reached 100% progress in each course.
        </p>
      </div>

      <div className="mt-6 h-80">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(168, 85, 247, 0.14)" strokeDasharray="3 3" />
              <XAxis
                dataKey="courseName"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={truncateLabel}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                formatter={(value) => [formatPercent(getNumericTooltipValue(value)), "Completion"]}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: "#12092A",
                  border: "1px solid rgba(168, 85, 247, 0.25)",
                  borderRadius: "16px",
                }}
                itemStyle={{ color: "#F5F3FF" }}
                labelStyle={{ color: "#D1D5DB" }}
              />
              <Bar
                dataKey="completionRate"
                radius={[12, 12, 0, 0]}
                fill="url(#completionGradient)"
                maxBarSize={52}
              />
              <defs>
                <linearGradient id="completionGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-purple-900/40 bg-[#12092A] px-6 text-center text-sm text-gray-400">
            Add courses and enrollments to unlock the completion breakdown.
          </div>
        )}
      </div>
    </section>
  )
}
