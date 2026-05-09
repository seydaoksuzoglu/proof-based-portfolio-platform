import { NextResponse } from "next/server"

import { AuthController } from "@/lib/controllers/auth-controller"
import { requireAuth } from "@/lib/auth"
import { handleApiError } from "@/lib/handle-api-error"

export async function POST() {
  try {
    await requireAuth()
    await AuthController.logout()

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
