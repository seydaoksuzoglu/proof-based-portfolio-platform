import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { ProjectController } from "@/lib/controllers/project-controller"
import { handleApiError } from "@/lib/handle-api-error"

/**
 * Plan 3.4.5 — PATCH /api/projects/[id]/visibility
 * requireAuth → sahiplik → isVisible toggle → 200
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const updated = await ProjectController.toggleVisibility(
      id,
      session.userId,
    )

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
