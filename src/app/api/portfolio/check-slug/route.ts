import { NextResponse } from "next/server"

import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { ValidationError } from "@/lib/errors"

/**
 * Plan 2.2.3 — Slug müsaitlik kontrolü (public, middleware whitelist'inde).
 * Onboarding modal'ında debounced çağrı için kullanılır.
 * PRD §10.5: Public erişim.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = url.searchParams.get("slug")

    if (!slug) {
      throw new ValidationError("'slug' query parameter is required")
    }

    const available = await PortfolioController.checkSlugAvailability(slug)
    return NextResponse.json({ available }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
