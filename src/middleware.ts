import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Plan 1.4.1 — Korumalı rotalarda session cookie kontrolü.
 * PRD §10.5 Erişim Kontrol Matrisi'ne göre public istisnalar var.
 */

const PUBLIC_API_PATHS = [
  "/api/portfolio/check-slug",
  "/api/portfolio/public/",
] as const

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public API istisnaları (PRD §9, §10.5)
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const session = request.cookies.get("portfolio-session")
  if (session) {
    return NextResponse.next()
  }

  const isApi = pathname.startsWith("/api")
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/login", request.url))
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/portfolio/:path*",
    "/api/projects/:path*",
    "/api/links/:path*",
  ],
}
