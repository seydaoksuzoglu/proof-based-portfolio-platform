import { NextResponse } from "next/server"

import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { handleApiError } from "@/lib/handle-api-error"

/**
 * Plan 2.2.4 — Public portföy verisi (SSG/ISR için).
 * PRD §10.5: Public erişim. Sadece isPublished=true + isVisible=true projeler.
 * Yayında değilse controller NotFoundError → handleApiError 404 döner.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const portfolio = await PortfolioController.getPublicPortfolio(slug)
    return NextResponse.json(portfolio, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
