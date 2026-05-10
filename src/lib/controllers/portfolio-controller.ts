import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "../db"
import { portfolio, project, link, user } from "../db/schema"
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors"
import {
  slugSchema,
  type CreatePortfolioInput,
  type UpdatePortfolioInput,
} from "../validators/portfolio"

type Portfolio = typeof portfolio.$inferSelect
type Project = typeof project.$inferSelect
type Link = typeof link.$inferSelect

export interface PublicPortfolio {
  slug: string
  theme: string
  owner: {
    fullName: string | null
    bio: string | null
    avatarUrl: string | null
  }
  projects: Project[]
  links: Link[]
}

/** Postgres UNIQUE violation error code */
const PG_UNIQUE_VIOLATION = "23505"

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === PG_UNIQUE_VIOLATION
  )
}

export class PortfolioController {
  /**
   * Plan 2.1.5 — Slug uygunluk kontrolü.
   * Format + rezerve (Zod refine) + DB UNIQUE kontrolü.
   * Geçersiz formatta ValidationError fırlatır; rezerve veya DB'de varsa false döner.
   */
  static async checkSlugAvailability(slug: string): Promise<boolean> {
    const normalized = slug.trim().toLowerCase()

    const parsed = slugSchema.safeParse(normalized)
    if (!parsed.success) {
      // Rezerve veya regex hatası — her iki durumda da "uygun değil" demek
      // ama format hatası için kullanıcıya açık feedback verelim
      const isReserved = parsed.error.issues.some((i) =>
        i.message.includes("ayrılmış"),
      )
      if (isReserved) return false
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Geçersiz slug")
    }

    const [existing] = await db
      .select({ id: portfolio.id })
      .from(portfolio)
      .where(eq(portfolio.slug, normalized))
      .limit(1)

    return !existing
  }

  /**
   * Plan 2.1.1 — Portföy oluşturma.
   * - 1 kullanıcı = 1 portföy (DB'de userId UNIQUE; ek olarak burada da kontrol)
   * - Slug regex + rezerve Zod katmanında zaten doğrulanmış olmalı (route handler parse eder)
   * - Race condition için DB UNIQUE violation yakalanır
   * PRD §8.1: ConflictError fırlatır (slug çakışma veya zaten portföy var).
   */
  static async createPortfolio(
    userId: string,
    data: CreatePortfolioInput,
  ): Promise<Portfolio> {
    const slug = data.slug.trim().toLowerCase()

    // Kullanıcı zaten portföye sahip mi? (1 user = 1 portfolio kuralı)
    const [existingForUser] = await db
      .select({ id: portfolio.id })
      .from(portfolio)
      .where(eq(portfolio.userId, userId))
      .limit(1)

    if (existingForUser) {
      throw new ConflictError("You already have a portfolio")
    }

    try {
      const [created] = await db
        .insert(portfolio)
        .values({
          userId,
          slug,
          theme: data.theme,
        })
        .returning()
      return created
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw new ConflictError("This slug is already taken")
      }
      throw err
    }
  }

  /**
   * Plan 2.1.2 — Public portföy.
   * Sadece isPublished=true; ilişkili isVisible=true Project'leri include eder.
   * Link'lerin görünürlük alanı yok (PRD §7.2 link tablosu) — hepsi gösterilir.
   * PRD §8.1: NotFoundError fırlatır (slug yok veya yayında değil).
   */
  static async getPublicPortfolio(slug: string): Promise<PublicPortfolio> {
    const normalized = slug.trim().toLowerCase()

    const [row] = await db
      .select({
        portfolio: portfolio,
        ownerFullName: user.fullName,
        ownerBio: user.bio,
        ownerAvatarUrl: user.avatarUrl,
      })
      .from(portfolio)
      .innerJoin(user, eq(portfolio.userId, user.id))
      .where(
        and(eq(portfolio.slug, normalized), eq(portfolio.isPublished, true)),
      )
      .limit(1)

    if (!row) {
      throw new NotFoundError("Portfolio not found or not published")
    }

    const projects = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.portfolioId, row.portfolio.id),
          eq(project.isVisible, true),
        ),
      )

    const links = await db
      .select()
      .from(link)
      .where(eq(link.portfolioId, row.portfolio.id))

    return {
      slug: row.portfolio.slug,
      theme: row.portfolio.theme,
      owner: {
        fullName: row.ownerFullName,
        bio: row.ownerBio,
        avatarUrl: row.ownerAvatarUrl,
      },
      projects,
      links,
    }
  }

  /**
   * Plan 2.1.3 — Portföy güncelleme.
   * Sahiplik kontrolü; slug değişiyorsa yeni çakışma kontrolü.
   * Slug değiştiyse ESKİ + YENİ slug için revalidatePath; aksi halde sadece güncel slug.
   */
  static async updatePortfolio(
    id: string,
    userId: string,
    data: UpdatePortfolioInput,
  ): Promise<Portfolio> {
    const [current] = await db
      .select()
      .from(portfolio)
      .where(eq(portfolio.id, id))
      .limit(1)

    if (!current) throw new NotFoundError("Portfolio not found")
    if (current.userId !== userId) throw new AuthorizationError()

    const patch: Partial<typeof portfolio.$inferInsert> = {
      updatedAt: new Date(),
    }

    let slugChanged = false

    if (data.slug && data.slug !== current.slug) {
      const newSlug = data.slug.trim().toLowerCase()
      const available = await this.checkSlugAvailability(newSlug)
      if (!available) throw new ConflictError("This slug is already taken")
      patch.slug = newSlug
      slugChanged = true
    }

    if (data.theme !== undefined) patch.theme = data.theme
    if (data.isPublished !== undefined) patch.isPublished = data.isPublished

    try {
      const [updated] = await db
        .update(portfolio)
        .set(patch)
        .where(eq(portfolio.id, id))
        .returning()

      // ISR cache invalidation
      if (slugChanged) {
        revalidatePath(`/${current.slug}`)
        revalidatePath(`/${updated.slug}`)
      } else if (updated.isPublished) {
        revalidatePath(`/${updated.slug}`)
      }

      return updated
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw new ConflictError("This slug is already taken")
      }
      throw err
    }
  }

  /**
   * Plan 2.3 destek (2026-05-10) — Dashboard için kullanıcının kendi portföyü.
   * isPublished filtresi YOK (taslak portföyü de döner — dashboard sahibine gösterilir).
   * Yoksa null döner (NotFoundError fırlatmaz — onboarding için "yok" durumu normal).
   */
  static async getByUserId(userId: string): Promise<Portfolio | null> {
    const [found] = await db
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, userId))
      .limit(1)

    return found ?? null
  }

  /**
   * Plan 2.1.4 — Yayın durumu toggle.
   * Sahiplik kontrolü; her iki yönde de revalidatePath çağrılır
   * (yayından kaldırırken de cache temizlensin ki 404 anında yansısın).
   */
  static async publishPortfolio(
    id: string,
    userId: string,
    status: boolean,
  ): Promise<Portfolio> {
    const [current] = await db
      .select()
      .from(portfolio)
      .where(eq(portfolio.id, id))
      .limit(1)

    if (!current) throw new NotFoundError("Portfolio not found")
    if (current.userId !== userId) throw new AuthorizationError()

    const [updated] = await db
      .update(portfolio)
      .set({ isPublished: status, updatedAt: new Date() })
      .where(eq(portfolio.id, id))
      .returning()

    revalidatePath(`/${updated.slug}`)
    return updated
  }
}
