import { NextResponse } from "next/server"

import { AuthController } from "@/lib/controllers/auth-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { resetPasswordRequestSchema } from "@/lib/validators/auth"

/**
 * Account enumeration önlemi (PRD §10.4):
 * Email kayıtlı olsun olmasın her durumda 200 dönülür.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = resetPasswordRequestSchema.parse(body)
    await AuthController.requestPasswordReset(email)

    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent" },
      { status: 200 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
