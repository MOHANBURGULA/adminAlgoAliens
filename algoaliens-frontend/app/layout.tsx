"use client"

import "./globals.css"
import { usePathname } from "next/navigation"
import AppSidebar from "@/components/layout/AppSidebar"
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
    pathname === "/signup" ||
    pathname === "/signin" ||
    pathname === "/forgot-password" ||
    pathname?.startsWith("/reset-password/") ||
    pathname === "/profile-setup" ||
    pathname === "/auth/success"

  return (
    <html lang="en">
      <body className="text-white antialiased">
        <Providers>
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
        </Providers>
      </body>
    </html>
  )
}
