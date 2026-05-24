/**
 * Plan 5.1.1 — DELETE /api/account
 * Hesap ve tüm verileri sil (cascade).
 * requireAuth() → parola tekrar iste → verifyPassword → delete → session temizle → 204
 */

import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAuth } from "@/lib/auth"
import { UserController } from "@/lib/controllers/user-controller"
import { handleApiError } from "@/lib/handle-api-error"

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Parola zorunludur"),
})

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { password } = deleteAccountSchema.parse(body)

    await UserController.deleteAccount(session.userId, password)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
