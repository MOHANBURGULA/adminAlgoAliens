"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, BookOpen, GraduationCap, LayoutDashboard, Library, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/courses", icon: BookOpen, label: "Courses" },
  { href: "/my-courses", icon: Library, label: "My Courses" },
  { href: "/certificates", icon: Award, label: "Certificates" },
  { href: "/profile", icon: User, label: "Profile" },
] as const

function isActiveRoute(pathname: string | null, href: string) {
  if (!pathname) {
    return false
  }

  if (href === "/courses") {
    return pathname === href || pathname.startsWith("/courses/")
  }

  return pathname === href
}

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
}: {
  href: string
  icon: (props: { className?: string; size?: number }) => React.ReactNode
  label: string
  pathname: string | null
}) {
  const active = isActiveRoute(pathname, href)

  return (
    <Link
      href={href}
      className={cn(
        "sidebar-item justify-start px-4 py-3 text-sm font-medium",
        active &&
          "border-fuchsia-400/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.2),rgba(217,70,239,0.14))] text-white shadow-[0_18px_34px_rgba(124,58,237,0.18)]",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]",
          active && "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100",
        )}
      >
        <Icon size={18} />
      </span>
      <span>{label}</span>
    </Link>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <>
      <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(6,5,12,0.98),rgba(11,7,19,0.98))] px-4 py-4 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-fuchsia-950/20">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/70">Learner Area</p>
            <p className="text-base font-semibold text-white">AlgoAliens</p>
          </div>
        </Link>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <aside className="hidden w-64 shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,rgba(6,5,12,0.99),rgba(11,7,19,0.99))] px-5 py-6 md:flex md:min-h-screen md:flex-col">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-fuchsia-950/20">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/70">Learner Area</p>
            <h1 className="text-lg font-semibold text-white">AlgoAliens</h1>
          </div>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-3">
          {navigationItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    </>
  )
}
