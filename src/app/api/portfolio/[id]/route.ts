import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { updatePortfolioSchema } from "@/lib/validators/portfolio"

/**
 * Plan 2.2.2 — Portföy güncelleme.
 * Sahiplik kontrolü controller içinde (AuthorizationError → 403).
 * Slug değişiyorsa controller hem eski hem yeni slug için revalidatePath çağırır.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const body = await request.json()
    const data = updatePortfolioSchema.parse(body)

    const updated = await PortfolioController.updatePortfolio(
      id,
      session.userId,
      data,
    )

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
