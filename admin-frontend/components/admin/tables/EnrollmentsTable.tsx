"use client"

import ProgressBar from "@/components/admin/ui/ProgressBar"
import Table, { type AdminTableColumn } from "@/components/admin/ui/Table"
import {
  getEnrollmentStatusMeta,
  type EnrollmentTableRow,
} from "@/lib/admin-dashboard"

type EnrollmentsTableProps = {
  rows: EnrollmentTableRow[]
}

export default function EnrollmentsTable({ rows }: EnrollmentsTableProps) {
  const columns: AdminTableColumn<EnrollmentTableRow>[] = [
    {
      key: "userName",
      header: "User Name",
      render: (row) => (
        <div>
          <p className="text-white">{row.userName}</p>
          <p className="mt-1 text-xs text-gray-500">ID #{row.userId}</p>
        </div>
      ),
    },
    {
      key: "courseName",
      header: "Course",
      render: (row) => (
        <div>
          <p className="text-white">{row.courseName}</p>
          <p className="mt-1 text-xs text-gray-500">ID #{row.courseId}</p>
        </div>
      ),
    },
    {
      key: "enrollmentDate",
      header: "Enrollment Date",
      render: (row) => row.enrollmentDate,
    },
    {
      key: "progress",
      header: "Progress",
      className: "min-w-60",
      render: (row) => <ProgressBar value={row.progress} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const status = getEnrollmentStatusMeta(row.status)

        return (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.badgeClassName}`}>
            {status.label}
          </span>
        )
      },
    },
  ]

  return (
    <Table
      data={rows}
      columns={columns}
      getRowKey={(row) => row.id}
      stickyHeader
      hoverRows
      rowClassName={(row) => {
        if (row.status === "completed") {
          return "bg-emerald-500/[0.04]"
        }

        if (row.status === "in_progress") {
          return "bg-amber-500/[0.03]"
        }

        return undefined
      }}
      emptyState={
        <div className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300 shadow-lg shadow-black/20">
          No enrollments match the current filters.
        </div>
      }
      renderMobileCard={(row) => {
        const status = getEnrollmentStatusMeta(row.status)

        return (
          <article className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-5 shadow-lg shadow-black/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{row.userName}</h3>
                <p className="mt-1 text-sm text-gray-400">{row.courseName}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.badgeClassName}`}>
                {status.label}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">User ID</p>
                <p className="mt-1 text-white">#{row.userId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Course ID</p>
                <p className="mt-1 text-white">#{row.courseId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Enrollment Date</p>
                <p className="mt-1 text-white">{row.enrollmentDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Progress</p>
                <p className="mt-1 text-white">{row.progress}%</p>
              </div>
            </div>

            <ProgressBar value={row.progress} className="mt-5" />
          </article>
        )
      }}
    />
  )
}
