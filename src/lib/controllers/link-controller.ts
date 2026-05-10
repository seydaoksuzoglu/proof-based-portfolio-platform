import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "../db"
import { link, portfolio } from "../db/schema"
import { getIconForUrl } from "../get-icon-for-url"
import {
  AuthorizationError,
  NotFoundError,
} from "../errors"
import type { LinkInput } from "../validators/link"

type Link = typeof link.$inferSelect

/**
 * Plan 3.2 — Link CRUD.
 * Sahiplik zinciri: link.portfolioId → portfolio.userId === session.userId
 * icon boşsa getIconForUrl ile otomatik eşleştirilir.
 */
export class LinkController {
  /**
   * Portfolio sahiplik kontrolü + slug döner (revalidatePath için).
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
   * Link üzerinden sahiplik kontrolü.
   */
  private static async getLinkWithOwnership(
    linkId: string,
    userId: string,
  ) {
    const [l] = await db
      .select()
      .from(link)
      .where(eq(link.id, linkId))
      .limit(1)

    if (!l) throw new NotFoundError("Link not found")

    const p = await this.getPortfolioForUser(l.portfolioId, userId)
    return { link: l, portfolioSlug: p.slug }
  }

  /**
   * Plan 3.2.1 — Yeni bağlantı oluşturma.
   * icon boşsa URL'den otomatik eşleştirilir (PRD §8.1 LinkController).
   */
  static async createLink(
    portfolioId: string,
    userId: string,
    data: LinkInput,
  ): Promise<Link> {
    const p = await this.getPortfolioForUser(portfolioId, userId)

    const icon = data.icon || getIconForUrl(data.url)

    const [created] = await db
      .insert(link)
      .values({
        portfolioId,
        title: data.title,
        url: data.url,
        icon,
      })
      .returning()

    revalidatePath(`/${p.slug}`)
    return created
  }

  /**
   * Kullanıcının tüm linklerini getir (createdAt DESC).
   */
  static async getLinksByUser(userId: string): Promise<Link[]> {
    const [p] = await db
      .select({ id: portfolio.id })
      .from(portfolio)
      .where(eq(portfolio.userId, userId))
      .limit(1)

    if (!p) return []

    return db
      .select()
      .from(link)
      .where(eq(link.portfolioId, p.id))
      .orderBy(link.createdAt)
  }

  /**
   * Plan 3.2.2 — Bağlantı güncelleme.
   */
  static async updateLink(
    id: string,
    userId: string,
    data: LinkInput,
  ): Promise<Link> {
    const { portfolioSlug } = await this.getLinkWithOwnership(id, userId)

    const icon = data.icon || getIconForUrl(data.url)

    const [updated] = await db
      .update(link)
      .set({
        title: data.title,
        url: data.url,
        icon,
      })
      .where(eq(link.id, id))
      .returning()

    revalidatePath(`/${portfolioSlug}`)
    return updated
  }

  /**
   * Plan 3.2.3 — Bağlantı silme (kalıcı).
   */
  static async deleteLink(id: string, userId: string): Promise<void> {
    const { portfolioSlug } = await this.getLinkWithOwnership(id, userId)

    await db.delete(link).where(eq(link.id, id))

    revalidatePath(`/${portfolioSlug}`)
  }
}
