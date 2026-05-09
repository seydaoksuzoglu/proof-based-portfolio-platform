import { NextResponse } from "next/server"

import { AuthController } from "@/lib/controllers/auth-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { registerSchema } from "@/lib/validators/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)
    const created = await AuthController.register(data)

    return NextResponse.json(
      { id: created.id, email: created.email, fullName: created.fullName },
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
