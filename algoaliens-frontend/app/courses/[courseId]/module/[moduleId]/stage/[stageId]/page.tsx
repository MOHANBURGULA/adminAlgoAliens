"use client"

import { useState } from "react"
import {
  Upload,
  Video,
  FileText,
  Tag,
  Send,
  Folder,
  PlayCircle
} from "lucide-react"

export default function VideoUploadPage() {

  const [video, setVideo] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVideo(e.target.files[0])
    }
  }

  return (

    <div className="max-w-3xl mx-auto space-y-8">

      {/* HEADER */}

      <div>

        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Video className="text-purple-400" size={22}/>
          Upload Explanation Video
        </h1>

        <p className="text-gray-400 text-sm">
          Record and upload a video explaining your solution for review
        </p>

      </div>


      {/* UPLOAD BOX */}

<div className="border border-purple-700/30 rounded-xl p-10 bg-[#0f0622] 
hover:border-purple-500 
hover:bg-[#140a2e] 
transition-all duration-300">

  <label className="flex flex-col items-center justify-center gap-3 cursor-pointer group">

    <div className="w-12 h-12 flex items-center justify-center rounded-full 
    bg-purple-600/20 text-purple-400
    group-hover:bg-purple-600/40
    group-hover:scale-110
    transition">

      <Upload size={22}/>

    </div>

    <p className="text-white font-medium group-hover:text-purple-300 transition">
      Drop your video here or click to browse
    </p>

    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition">
      Supports MP4, MOV, WebM · Max 500MB
    </p>

    <input
      type="file"
      accept="video/*"
      onChange={handleFile}
      className="hidden"
    />

  </label>

</div>


      {/* TITLE */}

      <div>

        <label className="text-sm text-gray-300 flex items-center gap-2">
          <Tag size={14}/>
          Video Title *
        </label>

        <input
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          placeholder="e.g., Two Sum Solution Explanation"
          className="w-full mt-2 bg-[#140a2e] border border-purple-700/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        />

      </div>


      {/* DESCRIPTION */}

      <div>

        <label className="text-sm text-gray-300 flex items-center gap-2">
          <FileText size={14}/>
          Description / Notes
        </label>

        <textarea
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          placeholder="Briefly describe your approach and key insights..."
          rows={4}
          className="w-full mt-2 bg-[#140a2e] border border-purple-700/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        />

      </div>


      {/* SUBMIT BUTTON */}

      <button
        className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-400 to-cyan-400 font-semibold hover:opacity-90 flex items-center justify-center gap-2"
      >
        <Send size={18}/>
        Submit for Review
      </button>


      {/* PREVIOUS SUBMISSIONS */}

      <div className="space-y-4">

        <h3 className="text-white font-semibold flex items-center gap-2">
          <Folder size={18}/>
          Previous Submissions
        </h3>


        <div className="flex items-center justify-between bg-[#0f0622] border border-purple-700/30 rounded-lg px-4 py-3">

          <span className="text-white flex items-center gap-2">
            <PlayCircle size={16}/>
            Attempt 2
          </span>

          <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            Under Review
          </span>

        </div>


        <div className="flex items-center justify-between bg-[#0f0622] border border-purple-700/30 rounded-lg px-4 py-3">

          <span className="text-white flex items-center gap-2">
            <PlayCircle size={16}/>
            Attempt 1
          </span>

          <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400">
            Rejected
          </span>

        </div>

      </div>

    </div>

  )
}