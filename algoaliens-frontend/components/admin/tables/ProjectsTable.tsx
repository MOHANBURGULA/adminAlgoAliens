"use client"

import Badge from "@/components/admin/ui/Badge"
import Button from "@/components/admin/ui/Button"
import Table, { type AdminTableColumn } from "@/components/admin/ui/Table"
import {
  formatAdminDate,
  getCourseLabel,
  getProjectStatusMeta,
  type AdminProjectRecord,
} from "@/lib/admin-panel"

type ProjectsTableProps = {
  projects: AdminProjectRecord[]
  courseMap: Record<number, string>
  feedbackDrafts: Record<number, string>
  savingId: number | null
  onFeedbackChange: (projectId: number, value: string) => void
  onApprove: (project: AdminProjectRecord) => void
  onReject: (project: AdminProjectRecord) => void
}

function formatGithubLink(link: string) {
  return link.replace(/^https?:\/\//, "")
}

export default function ProjectsTable({
  projects,
  courseMap,
  feedbackDrafts,
  savingId,
  onFeedbackChange,
  onApprove,
  onReject,
}: ProjectsTableProps) {
  const columns: AdminTableColumn<AdminProjectRecord>[] = [
    {
      key: "projectId",
      header: "Project ID",
      render: (project) => <span className="font-medium text-white">#{project.id}</span>,
    },
    {
      key: "userId",
      header: "User ID",
      render: (project) => <span className="text-white">#{project.userId}</span>,
    },
    {
      key: "courseId",
      header: "Course ID",
      render: (project) => (
        <div>
          <p className="text-white">#{project.courseId}</p>
          <p className="mt-1 text-xs text-gray-500">{getCourseLabel(project.courseId, courseMap)}</p>
        </div>
      ),
    },
    {
      key: "githubLink",
      header: "GitHub Link",
      className: "min-w-64",
      render: (project) => (
        <a
          href={project.githubLink}
          target="_blank"
          rel="noreferrer"
          className="inline-block max-w-xs truncate text-cyan-300 transition hover:text-white"
          title={project.githubLink}
        >
          {formatGithubLink(project.githubLink)}
        </a>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "min-w-72",
      render: (project) => <p className="max-w-xl leading-6 text-gray-300">{project.description}</p>,
    },
    {
      key: "status",
      header: "Status",
      render: (project) => {
        const meta = getProjectStatusMeta(project.status)

        return (
          <div>
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <p className="mt-2 text-xs text-gray-500">{formatAdminDate(project.createdAt)}</p>
          </div>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "min-w-80",
      headerClassName: "text-right",
      render: (project) => (
        <div className="flex flex-col items-end gap-3">
          <input
            value={feedbackDrafts[project.id] ?? ""}
            onChange={(event) => onFeedbackChange(project.id, event.target.value)}
            placeholder="Optional feedback before rejection"
            className="input-ui max-w-sm"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="success"
              size="sm"
              disabled={savingId === project.id}
              onClick={() => onApprove(project)}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={savingId === project.id}
              onClick={() => onReject(project)}
            >
              Reject
            </Button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <Table
      data={projects}
      columns={columns}
      getRowKey={(project) => project.id}
      stickyHeader
      hoverRows
      rowClassName={(project) => {
        const tone = getProjectStatusMeta(project.status).tone

        if (tone === "green") {
          return "bg-emerald-500/[0.04]"
        }

        if (tone === "red") {
          return "bg-rose-500/[0.04]"
        }

        return "bg-amber-500/[0.03]"
      }}
      emptyState={
        <div className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300 shadow-lg shadow-black/20">
          No projects match the current filters.
        </div>
      }
      renderMobileCard={(project) => {
        const meta = getProjectStatusMeta(project.status)

        return (
          <article className="rounded-xl border border-purple-900/30 bg-[#0B0518] p-5 shadow-lg shadow-black/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Project #{project.id}</h3>
                <p className="mt-1 text-sm text-gray-400">User #{project.userId}</p>
              </div>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Course</p>
                <p className="mt-1 text-white">
                  #{project.courseId} - {getCourseLabel(project.courseId, courseMap)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Submitted</p>
                <p className="mt-1 text-white">{formatAdminDate(project.createdAt)}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-300">{project.description}</p>

            <a
              href={project.githubLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-cyan-300 transition hover:text-white"
            >
              {formatGithubLink(project.githubLink)}
            </a>

            {project.feedback ? (
              <p className="mt-3 text-sm text-rose-200">Feedback: {project.feedback}</p>
            ) : null}

            <input
              value={feedbackDrafts[project.id] ?? ""}
              onChange={(event) => onFeedbackChange(project.id, event.target.value)}
              placeholder="Optional feedback before rejection"
              className="input-ui mt-4"
            />

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="success"
                size="sm"
                disabled={savingId === project.id}
                onClick={() => onApprove(project)}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={savingId === project.id}
                onClick={() => onReject(project)}
              >
                Reject
              </Button>
            </div>
          </article>
        )
      }}
    />
  )
}
