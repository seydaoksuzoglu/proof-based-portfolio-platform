import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { UserController } from "@/lib/controllers/user-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { updateProfileSchema } from "@/lib/validators/user"

/**
 * Plan 2.4.1 — PATCH /api/user/profile
 * requireAuth() → kendi profilini günceller (sahiplik = session.userId).
 * Email değişikliği MVP'de yok — schema'da yok zaten.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const updated = await UserController.updateProfile(session.userId, data)
    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
