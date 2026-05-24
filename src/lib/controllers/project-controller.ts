import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { fetchGitHubRepos } from "../github"

import { db } from "../db"
import { project, portfolio } from "../db/schema"
import {
  AuthorizationError,
  NotFoundError,
} from "../errors"
import type { ProjectInput } from "../validators/project"

type Project = typeof project.$inferSelect

/**
 * Plan 3.1 — Proje CRUD + görünürlük toggle.
 * Sahiplik zinciri: project.portfolioId → portfolio.userId === session.userId
 * Her mutation'da revalidatePath ile public cache invalidate edilir.
 */
export class ProjectController {
  /**
   * Portfolionun slug'ını bul → revalidatePath için gerekli.
   * Aynı zamanda sahiplik kontrolü yapar.
   */
  private static async getPortfolioForUser(
    portfolioId: string,
    userId: string,
  ) {
    const [p] = await db
      .select({ id: portfolio.id, slug: portfolio.slug, userId: portfolio.userId })
      .from(portfolio)
      .where(eq(portfolio.id, portfolioId))
      .limit(1)

    if (!p) throw new NotFoundError("Portfolio not found")
    if (p.userId !== userId) throw new AuthorizationError()
    return p
  }

  /**
   * Proje üzerinden portfolioId → portfolio sahiplik kontrolü.
   * Proje bulunamazsa NotFoundError, sahiplik eşleşmezse AuthorizationError.
   */
  private static async getProjectWithOwnership(
    projectId: string,
    userId: string,
  ) {
    const [proj] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1)

    if (!proj) throw new NotFoundError("Project not found")

    const p = await this.getPortfolioForUser(proj.portfolioId, userId)
    return { project: proj, portfolioSlug: p.slug }
  }

  /**
   * Plan 3.1.1 — Yeni proje oluşturma.
   * Portfolio sahipliği kontrolü; isVisible default true (DB seviyesinde).
   */
  static async createProject(
    portfolioId: string,
    userId: string,
    data: ProjectInput,
  ): Promise<Project> {
    const p = await this.getPortfolioForUser(portfolioId, userId)

    const [created] = await db
      .insert(project)
      .values({
        portfolioId,
        title: data.title,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        demoUrl: data.demoUrl || null,
        githubUrl: data.githubUrl || null,
      })
      .returning()

    revalidatePath(`/${p.slug}`)
    return created
  }

  /**
   * Plan 3.4.2 — Kullanıcının tüm projelerini getir (createdAt DESC).
   */
  static async getProjectsByUser(userId: string): Promise<Project[]> {
    const [p] = await db
      .select({ id: portfolio.id })
      .from(portfolio)
      .where(eq(portfolio.userId, userId))
      .limit(1)

    if (!p) return []

    return db
      .select()
      .from(project)
      .where(eq(project.portfolioId, p.id))
      .orderBy(project.createdAt)
  }

  /**
   * Plan 3.1.2 — Proje güncelleme.
   */
  static async updateProject(
    id: string,
    userId: string,
    data: ProjectInput,
  ): Promise<Project> {
    const { portfolioSlug } = await this.getProjectWithOwnership(id, userId)

    const [updated] = await db
      .update(project)
      .set({
        title: data.title,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        demoUrl: data.demoUrl || null,
        githubUrl: data.githubUrl || null,
      })
      .where(eq(project.id, id))
      .returning()

    revalidatePath(`/${portfolioSlug}`)
    return updated
  }

  /**
   * Plan 3.1.3 — Proje silme (kalıcı).
   */
  static async deleteProject(id: string, userId: string): Promise<void> {
    const { portfolioSlug } = await this.getProjectWithOwnership(id, userId)

    await db.delete(project).where(eq(project.id, id))

    revalidatePath(`/${portfolioSlug}`)
  }

  /**
   * Plan 3.1.4 — isVisible toggle.
   */
  static async toggleVisibility(
    id: string,
    userId: string,
  ): Promise<Project> {
    const { project: proj, portfolioSlug } = await this.getProjectWithOwnership(id, userId)

    const [updated] = await db
      .update(project)
      .set({ isVisible: !proj.isVisible })
      .where(eq(project.id, id))
      .returning()

    revalidatePath(`/${portfolioSlug}`)
    return updated
  }

  /**
   * Plan 4.2.2 — GitHub'dan public repo'ları import et.
   * Çakışma yönetimi: aynı githubUrl varsa update, yoksa create.
   * PRD §8.1: importFromGitHub.
   */
  static async importFromGitHub(
    portfolioId: string,
    userId: string,
    githubUsername: string,
  ): Promise<{ imported: number; updated: number }> {
    const p = await this.getPortfolioForUser(portfolioId, userId)

    const repos = await fetchGitHubRepos(githubUsername)

    // Mevcut projeleri githubUrl ile eşleştir
    const existingProjects = await db
      .select()
      .from(project)
      .where(eq(project.portfolioId, portfolioId))

    const existingByGithubUrl = new Map(
      existingProjects
        .filter((pr) => pr.githubUrl)
        .map((pr) => [pr.githubUrl!, pr]),
    )

    let imported = 0
    let updated = 0

    for (const repo of repos) {
      const existing = existingByGithubUrl.get(repo.html_url)

      if (existing) {
        // Update: sadece description güncelle (kullanıcının title/diğer değişikliklerine dokunma)
        await db
          .update(project)
          .set({
            description: repo.description ?? existing.description,
            demoUrl: repo.homepage || existing.demoUrl,
          })
          .where(eq(project.id, existing.id))
        updated++
      } else {
        // Create: yeni proje oluştur
        await db.insert(project).values({
          portfolioId,
          title: repo.name,
          description: repo.description ?? null,
          githubUrl: repo.html_url,
          demoUrl: repo.homepage || null,
        })
        imported++
      }
    }

    revalidatePath(`/${p.slug}`)
    return { imported, updated }
  }
}
