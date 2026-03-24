"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { AdminCourseRecord } from "@/lib/admin-panel"

type CourseEditorModalProps = {
  course: AdminCourseRecord | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; difficulty: string }) => void
  open: boolean
}

type CourseEditorFormProps = {
  course: AdminCourseRecord
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; difficulty: string }) => void
}

function CourseEditorForm({
  course,
  loading = false,
  onClose,
  onSubmit,
}: CourseEditorFormProps) {
  const [title, setTitle] = useState(course.title)
  const [difficulty, setDifficulty] = useState(course.difficulty)

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Course title
        </label>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Course title"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Difficulty
        </label>
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          className="input-ui"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSubmit({ title, difficulty })}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

export function CourseEditorModal({
  course,
  loading = false,
  onClose,
  onSubmit,
  open,
}: CourseEditorModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) {
          onClose()
        }
      }}
      title="Edit Course"
      description="Update the course title and difficulty without leaving the admin dashboard."
      footer={null}
    >
      {course ? (
        <CourseEditorForm
          key={course.id}
          course={course}
          loading={loading}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  )
}
