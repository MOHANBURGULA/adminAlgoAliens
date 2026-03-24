import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type AdminTableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

type TableProps<T> = {
  data: T[]
  columns: AdminTableColumn<T>[]
  getRowKey: (row: T) => string | number
  renderMobileCard: (row: T) => ReactNode
  emptyState: ReactNode
  rowClassName?: (row: T) => string | undefined
  stickyHeader?: boolean
  hoverRows?: boolean
}

export default function Table<T>({
  data,
  columns,
  getRowKey,
  renderMobileCard,
  emptyState,
  rowClassName,
  stickyHeader = false,
  hoverRows = false,
}: TableProps<T>) {
  if (!data.length) {
    return <>{emptyState}</>
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {data.map((row) => (
          <div key={getRowKey(row)}>{renderMobileCard(row)}</div>
        ))}
      </div>

      <div
        className={cn(
          "hidden rounded-2xl border border-purple-900/30 bg-[#0B0518] shadow-lg shadow-black/20 md:block",
          stickyHeader ? "overflow-visible" : "overflow-hidden",
        )}
      >
        <div className={cn("overflow-x-auto", stickyHeader && "overflow-y-visible")}>
          <table className="min-w-full divide-y divide-purple-900/30">
            <thead className="bg-[#12092A]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-gray-400",
                      stickyHeader && "sticky top-0 z-[1] bg-[#12092A]",
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20">
              {data.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={cn(
                    hoverRows && "transition-colors hover:bg-white/[0.03]",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-4 text-sm text-gray-300 align-top", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
