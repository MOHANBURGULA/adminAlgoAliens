"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Folder,
  Award
} from "lucide-react"

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#0F0A19] border-r border-purple-900 p-5">

      <h1 className="text-lg font-semibold text-purple-400 mb-10">
        AlgoAliens
      </h1>

      <nav className="flex flex-col gap-5 text-sm">

        <Link href="/dashboard" className="hover:text-purple-400">
          <LayoutDashboard size={18}/> Dashboard
        </Link>

        <Link href="/courses" className="text-purple-400">
          <BookOpen size={18}/> Courses
        </Link>

        <Link href="/video-upload" className="hover:text-purple-400">
          <Upload size={18}/> Video Upload
        </Link>

        <Link href="/projects" className="hover:text-purple-400">
          <Folder size={18}/> Projects
        </Link>

        <Link href="/certificates" className="hover:text-purple-400">
          <Award size={18}/> Certificates
        </Link>

      </nav>
    </aside>
  )
}