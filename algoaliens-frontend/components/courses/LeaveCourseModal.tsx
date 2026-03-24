"use client"

type LeaveCourseModalProps = {
  busy?: boolean
  courseTitle: string
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function LeaveCourseModal({
  busy = false,
  courseTitle,
  open,
  onCancel,
  onConfirm,
}: LeaveCourseModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-red-500/20 bg-[#0B0518] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-red-200/80">
          Leave course
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{courseTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-300">
          This will remove the course from your active enrollments and send you back
          to the public courses page.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]"
          >
            Keep course
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Leaving..." : "Leave course"}
          </button>
        </div>
      </div>
    </div>
  )
}
