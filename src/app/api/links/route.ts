import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { LinkController } from "@/lib/controllers/link-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { linkSchema } from "@/lib/validators/link"

/**
 * Plan 3.4.6 — POST /api/links
 * requireAuth → portfolioId bul → Zod → LinkController.createLink → 201
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const portfolio = await PortfolioController.getByUserId(session.userId)
    if (!portfolio) {
      return NextResponse.json(
        { error: "Create a portfolio first" },
        { status: 400 },
      )
    }

    const body = await request.json()
    const data = linkSchema.parse(body)
    const created = await LinkController.createLink(
      portfolio.id,
      session.userId,
      data,
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Plan 3.4.7 — GET /api/links
 * requireAuth → kullanıcının tüm linkleri
 */
export async function GET() {
  try {
    const session = await requireAuth()
    const links = await LinkController.getLinksByUser(session.userId)

    return NextResponse.json(links, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
