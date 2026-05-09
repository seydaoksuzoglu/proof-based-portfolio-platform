import { NextResponse } from "next/server"

import { AuthController } from "@/lib/controllers/auth-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { resetPasswordConfirmSchema } from "@/lib/validators/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = resetPasswordConfirmSchema.parse(body)
    await AuthController.confirmPasswordReset(data)

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
