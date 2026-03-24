"use client"

import Card from "@/components/admin/ui/Card"
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import type { AdminChartDatum } from "@/lib/admin-panel"

type AdminPieChartProps = {
  title: string
  description: string
  data: AdminChartDatum[]
  emptyMessage: string
}

function formatTooltipValue(value: number | string | ReadonlyArray<number | string> | undefined) {
  if (Array.isArray(value)) {
    return value.join(" - ")
  }

  return `${value ?? 0}`
}

export default function AdminPieChart({
  title,
  description,
  data,
  emptyMessage,
}: AdminPieChartProps) {
  const hasData = data.some((entry) => entry.value > 0)

  return (
    <Card title={title} description={description}>
      <div className="h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={60}
                outerRadius={92}
                paddingAngle={4}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="rgba(6, 2, 13, 0.9)" />
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
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: 16, color: "#D1D5DB" }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-purple-900/40 bg-[#12092A] px-6 text-center text-sm text-gray-400">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  )
}
