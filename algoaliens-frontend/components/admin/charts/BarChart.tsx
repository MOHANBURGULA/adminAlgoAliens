"use client"

import Card from "@/components/admin/ui/Card"
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

type ChartRow = {
  name: string
  value: number
}

type AdminBarChartProps = {
  title: string
  description: string
  data: ChartRow[]
  valueLabel: string
  emptyMessage: string
}

function truncateLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 14)}...` : value
}

function getValueLabel(value: number | string | ReadonlyArray<number | string> | undefined) {
  if (Array.isArray(value)) {
    return `${value[0] ?? 0}`
  }

  return `${value ?? 0}`
}

export default function AdminBarChart({
  title,
  description,
  data,
  valueLabel,
  emptyMessage,
}: AdminBarChartProps) {
  return (
    <Card title={title} description={description}>
      <div className="h-80">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="rgba(168, 85, 247, 0.14)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickFormatter={truncateLabel}
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
                formatter={(value) => [getValueLabel(value), valueLabel]}
                contentStyle={{
                  backgroundColor: "#12092A",
                  border: "1px solid rgba(168, 85, 247, 0.25)",
                  borderRadius: "16px",
                }}
                itemStyle={{ color: "#F5F3FF" }}
                labelStyle={{ color: "#D1D5DB" }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="url(#adminBarGradient)" maxBarSize={56} />
              <defs>
                <linearGradient id="adminBarGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </RechartsBarChart>
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
