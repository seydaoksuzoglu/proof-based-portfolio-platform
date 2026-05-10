import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { createPortfolioSchema } from "@/lib/validators/portfolio"

/**
 * Plan 2.2.1 — Portföy oluşturma.
 * PRD §9: 1 kullanıcı = 1 portföy. Slug regex + rezerve kontrolü Zod katmanında.
 * Sahiplik: session.userId üzerinden.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const data = createPortfolioSchema.parse(body)

    const created = await PortfolioController.createPortfolio(session.userId, data)

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
