"use client"

import Link from "next/link"
import { Layers3, ScrollText, Trash2 } from "lucide-react"
import Badge from "@/components/admin/ui/Badge"
import Button, { buttonStyles } from "@/components/admin/ui/Button"
import { formatAdminDate, getDifficultyMeta, type AdminCourseRecord } from "@/lib/admin-panel"

type CourseCardProps = {
  course: AdminCourseRecord
  deleting?: boolean
  onEdit: (course: AdminCourseRecord) => void
  onDelete: (course: AdminCourseRecord) => void
}

export default function CourseCard({
  course,
  deleting = false,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const difficultyMeta = getDifficultyMeta(course.difficulty)

  return (
    <article className="surface-card flex h-full flex-col overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Course #{course.id}</p>
          <h2 className="mt-3 line-clamp-2 break-words text-xl font-semibold leading-tight text-white">
            {course.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge tone={difficultyMeta.tone}>{difficultyMeta.label}</Badge>
            <span className="truncate text-xs text-slate-400">
              Created {formatAdminDate(course.createdAt)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-white/[0.03] p-3 text-cyan-200">
          <ScrollText size={20} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="surface-stat">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Modules</p>
          <p className="mt-2 text-2xl font-semibold text-white">{course.moduleCount ?? 0}</p>
        </div>
        <div className="surface-stat">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Enrollments</p>
          <p className="mt-2 text-2xl font-semibold text-white">{course.enrollmentCount ?? 0}</p>
        </div>
        <div className="surface-stat">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Certificates</p>
          <p className="mt-2 text-2xl font-semibold text-white">{course.certificateCount ?? 0}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Layers3 size={14} />
        Delete stays blocked when a course still has enrollments.
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap">
        <Link
          href={`/admin/courses/${course.id}/modules`}
          className={buttonStyles({ variant: "outline", className: "w-full sm:w-auto" })}
        >
          Manage Modules
        </Link>
        <Button variant="ghost" className="w-full sm:w-auto" onClick={() => onEdit(course)}>
          Edit Course
        </Button>
        <Button
          variant="danger"
          className="w-full sm:w-auto"
          onClick={() => onDelete(course)}
          disabled={deleting}
        >
          <Trash2 size={16} />
          {deleting ? "Deleting..." : "Delete Course"}
        </Button>
      </div>
    </article>
  )
}
