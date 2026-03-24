"use client"

import "./globals.css"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  BookOpen,
  LayoutDashboard,
  Library,
  User,
} from "lucide-react"
import Providers from "./providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const hideSidebar =
    pathname?.startsWith("/admin") ||
    pathname === "/" ||
    pathname === "/courses" ||
    pathname === "/signup" ||
    pathname === "/signin" ||
    pathname === "/forgot-password" ||
    pathname?.startsWith("/reset-password/") ||
    pathname === "/profile-setup" ||
    pathname === "/auth/success"

  return (
    <html lang="en">
      <body className="bg-[#0B0F1A] text-white antialiased">
        <Providers>
          <div className="grid-bg flex min-h-screen">
            {!hideSidebar && (
              <aside className="hidden w-64 border-r border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,15,26,0.98))] p-6 md:flex md:flex-col">
                <Link href="/dashboard">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                    Learning hub
                  </p>
                  <h1 className="mb-10 mt-3 text-xl font-semibold text-white transition hover:text-cyan-100">
                    AlgoAliens
                  </h1>
                </Link>

                <nav className="flex flex-col gap-2">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      pathname === "/dashboard"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>

                  <Link
                    href="/courses"
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      pathname === "/courses"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <BookOpen size={18} />
                    Courses
                  </Link>

                  <Link
                    href="/my-courses"
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      pathname === "/my-courses"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <Library size={18} />
                    My Courses
                  </Link>

                  <Link
                    href="/certificates"
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      pathname === "/certificates"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <Award size={18} />
                    Certificates
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      pathname === "/profile"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                </nav>

                <div className="mt-auto pt-8 text-xs text-slate-500">AlgoAliens © 2026</div>
              </aside>
            )}

            <main
              className={`flex-1 overflow-y-auto ${
                hideSidebar ? "" : "px-6 py-6 lg:px-8 lg:py-8"
              }`}
            >
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
