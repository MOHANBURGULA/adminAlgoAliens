"use client"

import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import { BookOpenText, FileUp, Upload } from "lucide-react"
import Button from "@/components/admin/ui/Button"
import { getApiErrorMessage } from "@/lib/http"
import { type TheoryResource, uploadTheoryResource } from "@/lib/theory"

type TheoryUploadFormProps = {
  moduleId: number
  onUploaded?: (resource: TheoryResource) => void
  resource: TheoryResource | null
}

export function TheoryUploadForm({ moduleId, onUploaded, resource }: TheoryUploadFormProps) {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file) {
      toast.error("Choose a PDF or Markdown file first.")
      return
    }

    const formData = new FormData()
    formData.append("moduleId", String(moduleId))
    formData.append("title", title.trim() || file.name.replace(/\.[^.]+$/, ""))
    formData.append("file", file)

    try {
      setUploading(true)
      const uploadedResource = await uploadTheoryResource(formData)
      setTitle("")
      setFile(null)
      onUploaded?.(uploadedResource)
      toast.success("Theory resource uploaded")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0C0816] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Theory upload</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Upload PDF or Markdown theory</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Upload a polished theory resource for this module. Learners will automatically get the
            right reader experience based on whether the file is a PDF or Markdown document.
          </p>
        </div>

        {resource ? (
          <Link
            href={`/theory/${moduleId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100 transition hover:bg-fuchsia-500/20"
          >
            <BookOpenText size={16} />
            Open reader
          </Link>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Theory title"
          className="input-ui"
        />

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center transition hover:border-fuchsia-400/30 hover:bg-fuchsia-500/[0.04]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-100">
            <FileUp size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {file ? file.name : "Drop a PDF or Markdown file here"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Accepted formats: `.pdf`, `.md`</p>
          </div>
          <input
            type="file"
            accept=".pdf,.md,text/markdown,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <Button type="submit" variant="primary" className="w-full" disabled={uploading}>
          <Upload size={16} />
          {uploading ? "Uploading theory..." : "Upload theory resource"}
        </Button>
      </form>

      {resource ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-[#12092A] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Current theory resource
          </p>
          <p className="mt-2 text-sm font-medium text-white">{resource.title}</p>
          <p className="mt-1 text-xs text-slate-400">
            {`${resource.fileType.toUpperCase()} - uploaded ${new Date(resource.createdAt).toLocaleString()}`}
          </p>
          <a
            href={resource.accessUrl ?? resource.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            Open file URL
          </a>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          No theory resource uploaded yet for this module.
        </div>
      )}
    </div>
  )
}
