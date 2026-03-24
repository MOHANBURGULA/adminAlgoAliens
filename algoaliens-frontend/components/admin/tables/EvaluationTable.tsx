import { getEvaluationStatusMeta, type EvaluationTableRow } from "@/lib/admin-dashboard"

type EvaluationTableProps = {
  rows: EvaluationTableRow[]
}

export default function EvaluationTable({ rows }: EvaluationTableProps) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300 shadow-lg shadow-black/20">
        No evaluations match the current filters.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {rows.map((row) => {
          const status = getEvaluationStatusMeta(row.status)
          const isFlagged = (row.aiDetectionScore ?? 0) > 60

          return (
            <article
              key={row.id}
              className={`rounded-2xl border p-5 shadow-lg shadow-black/20 ${
                isFlagged
                  ? "border-rose-500/30 bg-rose-500/10"
                  : "border-purple-900/30 bg-[#0B0518]"
              }`}
            >
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
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Score</p>
                  <p className="mt-1 text-white">{row.score === null ? "Pending" : `${row.score}%`}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Submitted</p>
                  <p className="mt-1 text-white">{row.createdAt}</p>
                </div>
              </div>

              {isFlagged ? (
                <p className="mt-4 text-sm text-rose-100">AI detection score flagged for review.</p>
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-purple-900/30 bg-[#0B0518] shadow-lg shadow-black/20 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-900/30">
            <thead className="bg-[#12092A]">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-gray-400">Course</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-gray-400">Score</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20">
              {rows.map((row) => {
                const status = getEvaluationStatusMeta(row.status)
                const isFlagged = (row.aiDetectionScore ?? 0) > 60

                return (
                  <tr key={row.id} className={isFlagged ? "bg-rose-500/5" : undefined}>
                    <td className="px-4 py-4 text-sm text-white">{row.userName}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">{row.courseName}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {row.score === null ? "Pending" : `${row.score}%`}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.badgeClassName}`}>
                          {status.label}
                        </span>
                        {isFlagged ? (
                          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200">
                            Flagged
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
