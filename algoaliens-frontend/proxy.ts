import { NextResponse, type NextRequest } from "next/server"
import { FEATURES } from "./config/features"
import { isAdminPath } from "./lib/routes"

export function proxy(request: NextRequest) {
  if (!isAdminPath(request.nextUrl.pathname) || FEATURES.ENABLE_ADMIN) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
  matcher: ["/admin/:path*"],
}
