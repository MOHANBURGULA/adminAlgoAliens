"use client"

import { usePathname } from "next/navigation"
import AppSidebar from "@/components/layout/AppSidebar"
import { shouldHideAppSidebar } from "@/lib/routes"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideSidebar = shouldHideAppSidebar(pathname)

  return (
    <div className={hideSidebar ? "min-h-screen" : "grid-bg min-h-screen"}>
      <div className="flex min-h-screen flex-col md:flex-row">
        {!hideSidebar ? <AppSidebar /> : null}

        <main
          className={`flex-1 overflow-y-auto ${
            hideSidebar ? "" : "px-4 py-5 md:px-6 md:py-6 xl:px-8 xl:py-8"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
