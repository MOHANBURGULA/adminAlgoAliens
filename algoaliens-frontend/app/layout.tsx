"use client"

import "./globals.css"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Providers from "./providers"

import {
  LayoutDashboard,
  BookOpen,
  Award,
  User,
  Library
} from "lucide-react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()

  const hideSidebar =
    pathname?.startsWith("/admin") ||
    pathname === "/" ||
    pathname === "/signup" ||
    pathname === "/signin" ||
    pathname === "/profile-setup" ||
    pathname === "/auth/success"

  return (
    <html lang="en">
      <body className="bg-[#070312] text-white">

        <Providers>

          <div className="grid-bg flex min-h-screen">

            {!hideSidebar && (
              <aside className="w-64 bg-[#0B0518] border-r border-purple-900/30 p-6 hidden md:flex flex-col">

                {/* LOGO */}
                <Link href="/dashboard">
                  <h1 className="text-xl font-bold text-purple-400 mb-10 cursor-pointer hover:text-purple-300 transition">
                    AlgoAliens
                  </h1>
                </Link>

                {/* NAVIGATION */}
                <nav className="flex flex-col gap-2">

                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      pathname === "/dashboard"
                        ? "bg-[#130A24] text-purple-400"
                        : "hover:bg-[#130A24]"
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>

                  <Link
                    href="/courses"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      pathname === "/courses"
                        ? "bg-[#130A24] text-purple-400"
                        : "hover:bg-[#130A24]"
                    }`}
                  >
                    <BookOpen size={18} />
                    Courses
                  </Link>

                  <Link
                    href="/my-courses"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      pathname === "/my-courses"
                        ? "bg-[#130A24] text-purple-400"
                        : "hover:bg-[#130A24]"
                    }`}
                  >
                    <Library size={18} />
                    My Courses
                  </Link>

                  <Link
                    href="/certificates"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      pathname === "/certificates"
                        ? "bg-[#130A24] text-purple-400"
                        : "hover:bg-[#130A24]"
                    }`}
                  >
                    <Award size={18} />
                    Certificates
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      pathname === "/profile"
                        ? "bg-[#130A24] text-purple-400"
                        : "hover:bg-[#130A24]"
                    }`}
                  >
                    <User size={18} />
                    Profile
                  </Link>

                </nav>

                {/* FOOTER */}
                <div className="mt-auto pt-8 text-xs text-gray-500">
                  AlgoAliens © 2026
                </div>

              </aside>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>

          </div>

        </Providers>

      </body>
    </html>
  )
}
