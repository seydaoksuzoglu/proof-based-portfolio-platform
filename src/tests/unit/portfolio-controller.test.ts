import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar (import'lardan önce hoist edilir) ──────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { db } from "@/lib/db"
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors"

// Drizzle chainable mock helper (auth-controller.test.ts pattern'i)
function chainable(finalValue: unknown) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(finalValue)),
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve(finalValue)),
    set: vi.fn(() => chain),
  }
  return chain
}

// Drizzle pure-array mock (where()'in sonunda Promise.resolve döndürmeyen sorgular için)
function arrayQuery(finalValue: unknown[]) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    where: vi.fn(() => Promise.resolve(finalValue)),
  }
  return chain
}

const USER_ID = "user-123"
const PORTFOLIO_ID = "portfolio-456"

describe("PortfolioController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 2.5.1 — checkSlugAvailability ────────────────────────────
  describe("checkSlugAvailability", () => {
    it("throws ValidationError on bad regex", async () => {
      // "AB" — 2 karakter, regex min 3
      await expect(
        PortfolioController.checkSlugAvailability("AB"),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it("returns false for reserved slug", async () => {
      // "admin" rezerve — DB'ye gitmeden false döner
      await expect(
        PortfolioController.checkSlugAvailability("admin"),
      ).resolves.toBe(false)
    })

    it("returns false when slug exists in DB", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "existing" }]) as never,
      )

      await expect(
        PortfolioController.checkSlugAvailability("demo-user"),
      ).resolves.toBe(false)
    })

    it("returns true when slug is free", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      await expect(
        PortfolioController.checkSlugAvailability("yeni-slug"),
      ).resolves.toBe(true)
    })

    it("normalizes uppercase to lowercase", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      await expect(
        PortfolioController.checkSlugAvailability("Demo-User"),
      ).resolves.toBe(true)
    })
  })

  // ─── Plan 2.5.1 — createPortfolio ──────────────────────────────────
  describe("createPortfolio", () => {
    it("creates portfolio when user has none", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never) // user has no portfolio
      vi.mocked(db.insert).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            theme: "minimal-light",
            isPublished: false,
          },
        ]) as never,
      )

      const result = await PortfolioController.createPortfolio(USER_ID, {
        slug: "demo",
        theme: "minimal-light",
      })

      expect(result.id).toBe(PORTFOLIO_ID)
      expect(result.slug).toBe("demo")
    })

    it("throws ConflictError when user already has portfolio (1 user = 1 portfolio)", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "existing" }]) as never,
      )

      await expect(
        PortfolioController.createPortfolio(USER_ID, {
          slug: "yeni",
          theme: "minimal-light",
        }),
      ).rejects.toBeInstanceOf(ConflictError)
    })

    it("converts Postgres UNIQUE violation to ConflictError (race condition)", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.reject({ code: "23505" })),
        })),
      } as never)

      await expect(
        PortfolioController.createPortfolio(USER_ID, {
          slug: "demo",
          theme: "minimal-light",
        }),
      ).rejects.toBeInstanceOf(ConflictError)
    })
  })

  // ─── Plan 2.5.1 — updatePortfolio (sahiplik) ───────────────────────
  describe("updatePortfolio", () => {
    it("throws NotFoundError when portfolio doesn't exist", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      await expect(
        PortfolioController.updatePortfolio(PORTFOLIO_ID, USER_ID, {
          theme: "minimal-dark",
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("throws AuthorizationError when user doesn't own the portfolio", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: "DIFFERENT-USER",
            slug: "demo",
            theme: "minimal-light",
            isPublished: false,
          },
        ]) as never,
      )

      await expect(
        PortfolioController.updatePortfolio(PORTFOLIO_ID, USER_ID, {
          theme: "minimal-dark",
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })

    it("updates theme successfully when user owns portfolio", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            theme: "minimal-light",
            isPublished: true,
          },
        ]) as never,
      )
      vi.mocked(db.update).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            theme: "minimal-dark",
            isPublished: true,
          },
        ]) as never,
      )

      const result = await PortfolioController.updatePortfolio(
        PORTFOLIO_ID,
        USER_ID,
        { theme: "minimal-dark" },
      )

      expect(result.theme).toBe("minimal-dark")
    })
  })

  // ─── Plan 2.5.1 — publishPortfolio ─────────────────────────────────
  describe("publishPortfolio", () => {
    it("throws AuthorizationError when user doesn't own portfolio", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([
          { id: PORTFOLIO_ID, userId: "OTHER", slug: "demo" },
        ]) as never,
      )

      await expect(
        PortfolioController.publishPortfolio(PORTFOLIO_ID, USER_ID, true),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })

    it("toggles isPublished and returns updated portfolio", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            isPublished: false,
          },
        ]) as never,
      )
      vi.mocked(db.update).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            isPublished: true,
          },
        ]) as never,
      )

      const result = await PortfolioController.publishPortfolio(
        PORTFOLIO_ID,
        USER_ID,
        true,
      )

      expect(result.isPublished).toBe(true)
    })
  })

  // ─── Plan 2.5.1 — getPublicPortfolio ───────────────────────────────
  describe("getPublicPortfolio", () => {
    it("throws NotFoundError when slug doesn't exist or not published", async () => {
      // Hem yok hem yayında değil aynı 404 (info leak önlemi)
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      await expect(
        PortfolioController.getPublicPortfolio("yok"),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("returns portfolio with owner + filtered projects + links", async () => {
      // İlk select: portfolio + owner join
      // İkinci select: visible projects
      // Üçüncü select: links
      let callCount = 0
      vi.mocked(db.select).mockImplementation((() => {
        callCount++
        if (callCount === 1) {
          return chainable([
            {
              portfolio: {
                id: PORTFOLIO_ID,
                slug: "demo",
                theme: "minimal-light",
                isPublished: true,
              },
              ownerFullName: "Demo",
              ownerBio: "bio",
              ownerAvatarUrl: null,
            },
          ]) as never
        }
        if (callCount === 2) {
          return arrayQuery([
            { id: "p1", title: "Proje 1", isVisible: true },
          ]) as never
        }
        return arrayQuery([
          { id: "l1", title: "GitHub", url: "https://github.com" },
        ]) as never
      }) as never)

      const result = await PortfolioController.getPublicPortfolio("demo")

      expect(result.slug).toBe("demo")
      expect(result.owner.fullName).toBe("Demo")
      expect(result.projects).toHaveLength(1)
      expect(result.links).toHaveLength(1)
    })
  })

  // ─── Plan 2.3 desteği — getByUserId ────────────────────────────────
  describe("getByUserId", () => {
    it("returns null when user has no portfolio", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      await expect(
        PortfolioController.getByUserId(USER_ID),
      ).resolves.toBeNull()
    })

    it("returns portfolio when user owns one (including unpublished)", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            isPublished: false, // taslak da döner
          },
        ]) as never,
      )

      const result = await PortfolioController.getByUserId(USER_ID)
      expect(result?.id).toBe(PORTFOLIO_ID)
      expect(result?.isPublished).toBe(false)
    })
  })
})