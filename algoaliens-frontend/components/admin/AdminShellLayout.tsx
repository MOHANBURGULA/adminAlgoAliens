"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Award,
  BarChart3,
  BookOpen,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Video,
} from "lucide-react"
import { FEATURES } from "@/config/features"
import BrandLogo from "@/components/layout/BrandLogo"
import { clearAdminSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const [pendingCounts, setPendingCounts] = useState({
    pendingProjects: 0,
    pendingVideos: 0,
  })
  const adminEnabled = FEATURES.ENABLE_ADMIN
  const isLoginRoute = pathname === "/admin/login"

  useEffect(() => {
    if (!adminEnabled || isLoginRoute) {
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
  }, [adminEnabled, isLoginRoute])

  if (!adminEnabled) {
    return null
  }

  if (isLoginRoute) {
    return <main className="min-h-screen">{children}</main>
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: User },
    { href: "/admin/enrollments", label: "Enrollments", icon: GraduationCap },
    { href: "/admin/evaluations", label: "Evaluations", icon: ShieldCheck },
    { href: "/admin/certificates", label: "Certificates", icon: Award },
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
    <div className="admin-shell flex min-h-screen text-theme-main">
      <aside className="admin-sidebar hidden w-72 border-r p-6 md:flex md:flex-col">
        <BrandLogo
          href="/admin/dashboard"
          size={52}
          showSubtitle
          subtitle="Control center"
          titleClassName="text-2xl"
        />

        <nav className="mt-10 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`admin-nav-link flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                  active ? "admin-nav-link-active" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {link.label}
                </span>
                {link.badge ? (
                  <span className="admin-count-badge px-2.5 py-1 text-[11px] font-medium">
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
          className="admin-danger-button mt-auto flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium"
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
