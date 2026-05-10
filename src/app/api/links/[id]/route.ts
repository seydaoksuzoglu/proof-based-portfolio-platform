import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { LinkController } from "@/lib/controllers/link-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { linkSchema } from "@/lib/validators/link"

/**
 * Plan 3.4.8 — PATCH /api/links/[id]
 * requireAuth → sahiplik → Zod → update → 200
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const data = linkSchema.parse(body)

    const updated = await LinkController.updateLink(
      id,
      session.userId,
      data,
    )

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Plan 3.4.9 — DELETE /api/links/[id]
 * requireAuth → sahiplik → delete → 204
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    await LinkController.deleteLink(id, session.userId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
