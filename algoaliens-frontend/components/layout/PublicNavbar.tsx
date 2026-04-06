"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useMounted } from "@/hooks/use-mounted"
import BrandLogo from "@/components/layout/BrandLogo"
import { isAuthenticated } from "@/lib/auth"
import { cn } from "@/lib/utils"

function isCoursesRoute(pathname: string | null) {
  return pathname === "/courses" || pathname?.startsWith("/courses/") || false
}

export default function PublicNavbar() {
  const pathname = usePathname()
  const mounted = useMounted()
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const syncAuthState = () => {
      setAuthenticated(isAuthenticated())
    }

    syncAuthState()
    window.addEventListener("storage", syncAuthState)

    return () => {
      window.removeEventListener("storage", syncAuthState)
    }
  }, [])

  const showAuthenticatedActions = mounted && authenticated

  return (
    <header className="public-nav-shell sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-8">
        <BrandLogo href="/" size={48} priority showWordmark titleClassName="text-xl" />

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className={cn("public-nav-link", pathname === "/" && "public-nav-link-active")}
          >
            Home
          </Link>
          <Link
            href="/courses"
            className={cn("public-nav-link", isCoursesRoute(pathname) && "public-nav-link-active")}
          >
            Courses
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {showAuthenticatedActions ? (
            <>
              <Link
                href="/dashboard"
                className="theme-outline-link hidden px-4 py-2 text-sm md:inline-flex"
              >
                Dashboard
              </Link>
              <Link href="/courses" className="theme-button-primary px-4 py-2 text-sm">
                Explore Catalog
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="theme-link-muted text-sm">
                Login
              </Link>
              <Link href="/signup" className="theme-button-primary px-4 py-2 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
