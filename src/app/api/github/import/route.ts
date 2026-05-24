/**
 * Plan 4.2.3 — POST /api/github/import
 * requireAuth() → body { githubUsername } → ProjectController.importFromGitHub() → 200
 * Dönüş: { imported: number, updated: number }
 */

import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAuth } from "@/lib/auth"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { ProjectController } from "@/lib/controllers/project-controller"
import { handleApiError } from "@/lib/handle-api-error"

const githubImportSchema = z.object({
  githubUsername: z
    .string()
    .min(1, "GitHub kullanıcı adı zorunludur")
    .max(39, "GitHub kullanıcı adı en fazla 39 karakter olabilir")
    .regex(
      /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
      "Geçersiz GitHub kullanıcı adı formatı",
    ),
})

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const portfolio = await PortfolioController.getByUserId(session.userId)

    if (!portfolio) {
      return NextResponse.json(
        { error: "Create a portfolio first" },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { githubUsername } = githubImportSchema.parse(body)

    const result = await ProjectController.importFromGitHub(
      portfolio.id,
      session.userId,
      githubUsername,
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // GitHub-specific errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 429 },
        )
      }
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "GitHub user not found" },
          { status: 404 },
        )
      }
    }
    return handleApiError(error)
  }
}
