"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, BookOpen, FolderKanban, LayoutDashboard, LogOut, Video } from "lucide-react"
import { clearAdminSession } from "@/lib/auth"

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/seed", label: "Seed Data", icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearAdminSession()
    router.replace("/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-[#070312] text-white">
      <aside className="hidden w-72 border-r border-purple-900/30 bg-[#0B0518] p-6 md:flex md:flex-col">
        <Link href="/admin/dashboard" className="text-2xl font-semibold text-purple-300">
          AlgoAliens Admin
        </Link>

        <nav className="mt-10 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-[#130A24] text-purple-300"
                    : "text-gray-300 hover:bg-[#130A24] hover:text-white"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-500"
        >
          <LogOut size={18} />
          Admin logout
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  )
}
