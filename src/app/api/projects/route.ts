import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { ProjectController } from "@/lib/controllers/project-controller"
import { handleApiError } from "@/lib/handle-api-error"
import { projectSchema } from "@/lib/validators/project"

/**
 * Plan 3.4.1 — POST /api/projects
 * requireAuth → portfolioId bul → Zod → ProjectController.createProject → 201
 */
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
    const data = projectSchema.parse(body)
    const created = await ProjectController.createProject(
      portfolio.id,
      session.userId,
      data,
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Plan 3.4.2 — GET /api/projects
 * requireAuth → kullanıcının tüm projeleri (createdAt DESC)
 */
export async function GET() {
  try {
    const session = await requireAuth()
    const projects = await ProjectController.getProjectsByUser(session.userId)

    return NextResponse.json(projects, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
