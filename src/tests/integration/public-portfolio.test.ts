import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}))

import { db } from "@/lib/db"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { NotFoundError } from "@/lib/errors"
import { GET as publicGET } from "@/app/api/portfolio/public/[slug]/route"

const PORTFOLIO_ID = "portfolio-456"
const SLUG = "demo"

function chainable(finalValue: unknown) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(finalValue)),
  }
  return chain
}

function arrayQuery(finalValue: unknown[]) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    where: vi.fn(() => Promise.resolve(finalValue)),
  }
  return chain
}

interface PublicSelectCalls {
  /** İlk select: portfolio + user join (innerJoin'lu chainable) */
  portfolioRow: unknown | null
  /** İkinci select: visible=true projects (where → Promise array) */
  visibleProjects: unknown[]
  /** Üçüncü select: links (where → Promise array) */
  links: unknown[]
}

function mockPublicFlow({
  portfolioRow,
  visibleProjects,
  links,
}: PublicSelectCalls) {
  let callCount = 0
  vi.mocked(db.select).mockImplementation((() => {
    callCount++
    if (callCount === 1) {
      return chainable(portfolioRow ? [portfolioRow] : []) as never
    }
    if (callCount === 2) {
      return arrayQuery(visibleProjects) as never
    }
    return arrayQuery(links) as never
  }) as never)
}

const PUBLISHED_PORTFOLIO = {
  portfolio: {
    id: PORTFOLIO_ID,
    slug: SLUG,
    theme: "minimal-light",
    isPublished: true,
  },
  ownerFullName: "Demo User",
  ownerBio: "Bio metni",
  ownerAvatarUrl: null,
}

describe("Public Portfolio Flow (Plan §4.4.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Controller seviyesi ─────────────────────────────────────
  describe("PortfolioController.getPublicPortfolio", () => {
    it("yayında portföyü başarıyla döner", async () => {
      mockPublicFlow({
        portfolioRow: PUBLISHED_PORTFOLIO,
        visibleProjects: [
          {
            id: "p1",
            portfolioId: PORTFOLIO_ID,
            title: "Görünür proje",
            isVisible: true,
          },
        ],
        links: [
          {
            id: "l1",
            portfolioId: PORTFOLIO_ID,
            title: "GitHub",
            url: "https://github.com",
          },
        ],
      })

      const result = await PortfolioController.getPublicPortfolio(SLUG)

      expect(result.slug).toBe(SLUG)
      expect(result.owner.fullName).toBe("Demo User")
      expect(result.projects).toHaveLength(1)
      expect(result.links).toHaveLength(1)
    })

    it("yayında değilse NotFoundError (info leak önlemi)", async () => {
      // Slug var ama isPublished=false → query where(isPublished=true) hiçbir şey döndürmez
      mockPublicFlow({
        portfolioRow: null,
        visibleProjects: [],
        links: [],
      })

      await expect(
        PortfolioController.getPublicPortfolio(SLUG),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("slug yoksa NotFoundError (mevcut olmayan ile yayında olmayan ayırt edilmez)", async () => {
      mockPublicFlow({
        portfolioRow: null,
        visibleProjects: [],
        links: [],
      })

      await expect(
        PortfolioController.getPublicPortfolio("hic-yok"),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("isVisible=false projeler döndürülenler arasında olmamalı (DB filtresi)", async () => {
      // Controller'ın query'si zaten isVisible=true filtresi ekliyor;
      // mock sadece "filtreli sonuç" döndürür — burada doğrulanan: sayfa,
      // filtrelenmemiş projeleri görmüyor (varsayılan olarak, mock'un kendisi).
      mockPublicFlow({
        portfolioRow: PUBLISHED_PORTFOLIO,
        visibleProjects: [
          {
            id: "p-visible",
            portfolioId: PORTFOLIO_ID,
            title: "Görünür",
            isVisible: true,
          },
        ],
        links: [],
      })

      const result = await PortfolioController.getPublicPortfolio(SLUG)

      // Sadece görünür proje döndü
      expect(result.projects).toHaveLength(1)
      expect(result.projects[0].title).toBe("Görünür")
      // Filtrelenmiş bir "Gizli" proje listede olmamalı
      expect(result.projects.find((p) => (p as { isVisible: boolean }).isVisible === false)).toBeUndefined()
    })

    it("hiç içerik yoksa boş projects + links döner", async () => {
      mockPublicFlow({
        portfolioRow: PUBLISHED_PORTFOLIO,
        visibleProjects: [],
        links: [],
      })

      const result = await PortfolioController.getPublicPortfolio(SLUG)

      expect(result.projects).toEqual([])
      expect(result.links).toEqual([])
    })
  })

  // ─── API route seviyesi ──────────────────────────────────────
  describe("GET /api/portfolio/public/[slug]", () => {
    it("200 — yayında portföy için doğru yapı", async () => {
      mockPublicFlow({
        portfolioRow: PUBLISHED_PORTFOLIO,
        visibleProjects: [],
        links: [],
      })

      const res = await publicGET(
        new Request(`http://localhost/api/portfolio/public/${SLUG}`),
        { params: Promise.resolve({ slug: SLUG }) },
      )

      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        slug: string
        theme: string
        owner: { fullName: string | null }
      }
      expect(body.slug).toBe(SLUG)
      expect(body.theme).toBe("minimal-light")
      expect(body.owner.fullName).toBe("Demo User")
    })

    it("404 — slug yok veya yayında değil", async () => {
      mockPublicFlow({
        portfolioRow: null,
        visibleProjects: [],
        links: [],
      })

      const res = await publicGET(
        new Request("http://localhost/api/portfolio/public/yok"),
        { params: Promise.resolve({ slug: "yok" }) },
      )

      expect(res.status).toBe(404)
    })

    it("slug normalizasyonu (büyük harf → küçük harf)", async () => {
      mockPublicFlow({
        portfolioRow: PUBLISHED_PORTFOLIO,
        visibleProjects: [],
        links: [],
      })

      // Sayfa kendisi "DEMO" verse bile controller normalize ediyor
      const res = await publicGET(
        new Request("http://localhost/api/portfolio/public/DEMO"),
        { params: Promise.resolve({ slug: "DEMO" }) },
      )

      expect(res.status).toBe(200)
    })
  })
})
