import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { ProjectController } from "@/lib/controllers/project-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { projectSchema } from "@/lib/validators/project"

/**
 * Plan 3.4.3 — PATCH /api/projects/[id]
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
    const data = projectSchema.parse(body)

    const updated = await ProjectController.updateProject(
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
 * Plan 3.4.4 — DELETE /api/projects/[id]
 * requireAuth → sahiplik → delete → 204
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    await ProjectController.deleteProject(id, session.userId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
