"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BarChart3, BookOpen, FolderKanban, GraduationCap, LayoutDashboard, LogOut, User, Video } from "lucide-react"
import { clearAdminSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const [pendingCounts, setPendingCounts] = useState({
    pendingProjects: 0,
    pendingVideos: 0,
  })
  const isLoginRoute = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginRoute) {
      return
    }

    let cancelled = false

    const loadPendingCounts = async () => {
      try {
        const response = await apiClient.get("/api/admin/dashboard")
        const payload = response.data as { pendingProjects?: number; pendingVideos?: number }

        if (!cancelled) {
          setPendingCounts({
            pendingProjects: payload.pendingProjects ?? 0,
            pendingVideos: payload.pendingVideos ?? 0,
          })
        }
      } catch {
        if (!cancelled) {
          setPendingCounts((current) => current)
        }
      }
    }

    void loadPendingCounts()
    const intervalId = window.setInterval(() => {
      void loadPendingCounts()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [isLoginRoute])

  if (isLoginRoute) {
    return <main className="min-h-screen">{children}</main>
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: User },
    { href: "/admin/enrollments", label: "Enrollments", icon: GraduationCap },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    {
      href: "/admin/projects",
      label: "Projects",
      icon: FolderKanban,
      badge: pendingCounts.pendingProjects,
    },
    {
      href: "/admin/videos",
      label: "Videos",
      icon: Video,
      badge: pendingCounts.pendingVideos,
    },
    { href: "/admin/courses", label: "Courses", icon: BookOpen },
  ]

  return (
    <div className="admin-shell flex min-h-screen bg-[#0B0F1A] text-white">
      <aside className="hidden w-72 border-r border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,15,26,0.98))] p-6 md:flex md:flex-col">
        <Link href="/admin/dashboard" className="block">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200/80">Control center</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">AlgoAliens Admin</h1>
        </Link>

        <nav className="mt-10 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${
                  active
                    ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-100"
                    : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {link.label}
                </span>
                {link.badge ? (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            clearAdminSession()
            router.replace("/admin/login")
          }}
          className="mt-auto flex items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/12 px-4 py-3 text-sm font-medium text-rose-100 transition-all duration-200 hover:scale-[1.01] hover:bg-rose-500/20"
        >
          <LogOut size={18} />
          Admin logout
        </button>
      </aside>

      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
