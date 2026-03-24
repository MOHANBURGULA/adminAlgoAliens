"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { AdminModule } from "@/lib/admin"

type ModuleEditorModalProps = {
  loading?: boolean
  mode: "create" | "edit"
  moduleItem?: AdminModule | null
  onClose: () => void
  onSubmit: (payload: { orderIndex: number; title: string }) => void
  open: boolean
  suggestedOrderIndex?: number
}

type ModuleEditorFormProps = {
  loading?: boolean
  mode: "create" | "edit"
  moduleItem?: AdminModule | null
  onClose: () => void
  onSubmit: (payload: { orderIndex: number; title: string }) => void
  suggestedOrderIndex?: number
}

function ModuleEditorForm({
  loading = false,
  mode,
  moduleItem = null,
  onClose,
  onSubmit,
  suggestedOrderIndex = 1,
}: ModuleEditorFormProps) {
  const [title, setTitle] = useState(moduleItem?.title ?? "")
  const [orderIndex, setOrderIndex] = useState(moduleItem?.orderIndex ?? suggestedOrderIndex)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Module title
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Arrays"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Order index
          </label>
          <Input
            type="number"
            min={1}
            value={orderIndex}
            onChange={(event) => setOrderIndex(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSubmit({ title, orderIndex })}
          disabled={loading}
        >
          {loading ? "Saving..." : mode === "create" ? "Create Module" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

export function ModuleEditorModal({
  loading = false,
  mode,
  moduleItem = null,
  onClose,
  onSubmit,
  open,
  suggestedOrderIndex = 1,
}: ModuleEditorModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) {
          onClose()
        }
      }}
      title={mode === "create" ? "Add Module" : "Edit Module"}
      description="Manage the ordered course structure without using browser prompts."
      footer={null}
    >
      <ModuleEditorForm
        key={moduleItem ? moduleItem.id : `create-${suggestedOrderIndex}`}
        loading={loading}
        mode={mode}
        moduleItem={moduleItem}
        onClose={onClose}
        onSubmit={onSubmit}
        suggestedOrderIndex={suggestedOrderIndex}
      />
    </Modal>
  )
}
