"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiClient } from "@/lib/axios"

type Project = {
  id: number
  userId: number
  courseId: number
  githubLink: string
  description: string
  status: string
  feedback?: string
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  const loadProjects = async () => {
    const response = await apiClient.get("/api/admin/projects")
    setProjects(response.data as Project[])
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiClient.put(`/api/admin/projects/${id}/status`, {
        status,
        feedback: status === "rejected" ? "Please improve the submission details." : undefined,
      })
      await loadProjects()
      toast.success(`Project ${status}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update project.")
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Project Reviews</h1>
        <p className="mt-2 text-sm text-gray-400">
          Approve or reject student project submissions.
        </p>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Project #{project.id} - Course {project.courseId}
                </h2>
                <p className="mt-2 text-sm text-gray-400">User ID: {project.userId}</p>
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-sm text-cyan-300 hover:text-white"
                >
                  {project.githubLink}
                </a>
                <p className="mt-3 text-sm text-gray-300">{project.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[#12092A] px-3 py-2 text-sm text-white">
                  {project.status}
                </span>
                <button
                  type="button"
                  onClick={() => void updateStatus(project.id, "approved")}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(project.id, "rejected")}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
