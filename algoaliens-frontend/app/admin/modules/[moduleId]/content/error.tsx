"use client"

export default function AdminModuleContentError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
      <p className="text-lg font-semibold">Module content unavailable</p>
      <p className="mt-2 text-sm text-red-100/90">
        The admin content screen hit an unexpected issue. Retry to continue editing.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-2xl border border-red-200/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
      >
        Retry
      </button>
    </div>
  )
}
