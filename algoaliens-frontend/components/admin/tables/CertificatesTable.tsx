"use client"

import Badge from "@/components/admin/ui/Badge"
import Table, { type AdminTableColumn } from "@/components/admin/ui/Table"
import { formatAdminDate } from "@/lib/admin-panel"

export type CertificateTableRow = {
  id: number
  userId: number
  courseId: number
  userName: string
  courseName: string
  score: number
  issuedAt?: string
}

type CertificatesTableProps = {
  rows: CertificateTableRow[]
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return "green" as const
  }

  if (score >= 75) {
    return "indigo" as const
  }

  if (score >= 60) {
    return "yellow" as const
  }

  return "red" as const
}

export default function CertificatesTable({ rows }: CertificatesTableProps) {
  const columns: AdminTableColumn<CertificateTableRow>[] = [
    {
      key: "id",
      header: "Certificate ID",
      render: (row) => <span className="font-medium text-white">#{row.id}</span>,
    },
    {
      key: "userId",
      header: "User ID",
      render: (row) => (
        <div>
          <p className="text-white">#{row.userId}</p>
          <p className="mt-1 text-xs text-gray-500">{row.userName}</p>
        </div>
      ),
    },
    {
      key: "courseId",
      header: "Course ID",
      render: (row) => (
        <div>
          <p className="text-white">#{row.courseId}</p>
          <p className="mt-1 text-xs text-gray-500">{row.courseName}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (row) => <Badge tone={getScoreTone(row.score)}>{row.score}</Badge>,
    },
    {
      key: "issuedAt",
      header: "Issued Date",
      render: (row) => formatAdminDate(row.issuedAt),
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
        const tone = getScoreTone(row.score)

        if (tone === "green") {
          return "bg-emerald-500/[0.04]"
        }

        if (tone === "red") {
          return "bg-rose-500/[0.04]"
        }

        return undefined
      }}
      emptyState={
        <div className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300 shadow-lg shadow-black/20">
          No certificates match the current filters.
        </div>
      }
      renderMobileCard={(row) => (
        <article className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-5 shadow-lg shadow-black/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Certificate #{row.id}</h3>
              <p className="mt-1 text-sm text-gray-400">Issued {formatAdminDate(row.issuedAt)}</p>
            </div>
            <Badge tone={getScoreTone(row.score)}>Score {row.score}</Badge>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500">User ID</p>
              <p className="mt-1 text-white">#{row.userId}</p>
              <p className="mt-1 text-xs text-gray-500">{row.userName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Course ID</p>
              <p className="mt-1 text-white">#{row.courseId}</p>
              <p className="mt-1 text-xs text-gray-500">{row.courseName}</p>
            </div>
          </div>
        </article>
      )}
    />
  )
}
