"use client"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

type ConfirmModalProps = {
  cancelLabel?: string
  confirmLabel?: string
  description: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
  open: boolean
  title: string
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) {
          onClose()
        }
      }}
      title={title}
      description={description}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-400">
        This action cannot be undone from the current screen.
      </p>
    </Modal>
  )
}
