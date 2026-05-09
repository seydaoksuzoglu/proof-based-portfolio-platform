import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { AppError } from "./errors"

/**
 * Tüm API route handler'larda yakalanan hataları HTTP yanıtına çevirir.
 * Teknik detay sunucu loguna; kullanıcıya jenerik mesaj (PRD §10.4).
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    )
  }

  console.error("[api:unhandled]", error)
  return NextResponse.json(
    { error: "Something went wrong" },
    { status: 500 },
  )
}
