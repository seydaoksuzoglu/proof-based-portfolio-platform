import { NextResponse } from "next/server"

import { AuthController } from "@/lib/controllers/auth-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { loginSchema } from "@/lib/validators/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)
    const session = await AuthController.login(data)

    return NextResponse.json(
      { userId: session.userId, email: session.email },
      { status: 200 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
