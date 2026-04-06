"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import BrandLogo from "@/components/layout/BrandLogo"
import { Award, BookOpen, LayoutDashboard, Library, User } from "lucide-react"
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
        active && "sidebar-item-active",
      )}
    >
      <span
        className={cn(
          "sidebar-item-icon flex h-9 w-9 items-center justify-center",
          active && "sidebar-item-icon-active",
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
      <div className="sidebar-mobile-shell border-b px-4 py-4 md:hidden">
        <BrandLogo href="/dashboard" size={40} showSubtitle subtitle="Learner area" />

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <aside className="sidebar-desktop-shell hidden w-64 shrink-0 border-r px-5 py-6 md:flex md:min-h-screen md:flex-col">
        <BrandLogo href="/dashboard" size={44} showSubtitle subtitle="Learner area" />

        <nav className="mt-8 flex flex-1 flex-col gap-3">
          {navigationItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    </>
  )
}
