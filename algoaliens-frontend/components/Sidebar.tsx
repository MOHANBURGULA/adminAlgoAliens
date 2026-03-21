"use client"

import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#06020D] border-r border-purple-900/30 p-6">

      {/* Logo */}
      <h1 className="text-xl font-bold text-purple-400 mb-8">
        AlgoAliens
      </h1>

      {/* Navigation */}
      <ul className="space-y-3">

        <li>
          <Link href="/dashboard" className="sidebar-item">
            Dashboard
          </Link>
        </li>

        <li>
          <Link href="/courses" className="sidebar-item">
            Courses
          </Link>
        </li>

        {/* Disabled Activities */}
        <li className="sidebar-item opacity-40 cursor-not-allowed">
          Activities
        </li>

        {/* Disabled MCQ */}
        <li className="sidebar-item opacity-40 cursor-not-allowed">
          MCQ Test
        </li>

        <li>
          <Link href="/video-upload" className="sidebar-item">
            Video Upload
          </Link>
        </li>

        <li>
          <Link href="/projects" className="sidebar-item">
            Projects
          </Link>
        </li>

        <li>
          <Link href="/certificates" className="sidebar-item">
            Certificates
          </Link>
        </li>

      </ul>

    </aside>
  )
}