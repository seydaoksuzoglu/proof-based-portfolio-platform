import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/lib/auth", async () => {
  const mod = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")
  return {
    ...mod,
    getSession: vi.fn(async () => ({
      userId: undefined,
      email: undefined,
      save: vi.fn(),
      destroy: vi.fn(),
    })),
    requireAuth: vi.fn(),
  }
})

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { AuthenticationError } from "@/lib/errors"
import { POST as createPOST } from "@/app/api/portfolio/route"
import { PATCH as updatePATCH } from "@/app/api/portfolio/[id]/route"
import { GET as checkSlugGET } from "@/app/api/portfolio/check-slug/route"
import { GET as publicGET } from "@/app/api/portfolio/public/[slug]/route"

const USER_ID = "user-123"
const PORTFOLIO_ID = "portfolio-456"

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

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

describe("Portfolio API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 2.5.2 — POST /api/portfolio ───────────────────────────────
  describe("POST /api/portfolio", () => {
    it("201 on success", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      vi.mocked(db.select).mockReturnValue(chainable([]) as never) // no existing portfolio
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

      const res = await createPOST(
        jsonRequest("http://localhost/api/portfolio", "POST", {
          slug: "demo",
          theme: "minimal-light",
        }),
      )

      expect(res.status).toBe(201)
      const body = (await res.json()) as { slug: string }
      expect(body.slug).toBe("demo")
    })

    it("401 when unauthenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthenticationError("Unauthorized"))

      const res = await createPOST(
        jsonRequest("http://localhost/api/portfolio", "POST", {
          slug: "demo",
          theme: "minimal-light",
        }),
      )

      expect(res.status).toBe(401)
    })

    it("400 on reserved slug (Zod refine)", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })

      const res = await createPOST(
        jsonRequest("http://localhost/api/portfolio", "POST", {
          slug: "admin", // rezerve
          theme: "minimal-light",
        }),
      )

      expect(res.status).toBe(400)
    })

    it("400 on bad regex", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })

      const res = await createPOST(
        jsonRequest("http://localhost/api/portfolio", "POST", {
          slug: "AB", // çok kısa
          theme: "minimal-light",
        }),
      )

      expect(res.status).toBe(400)
    })

    it("409 when user already has portfolio", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "existing" }]) as never,
      )

      const res = await createPOST(
        jsonRequest("http://localhost/api/portfolio", "POST", {
          slug: "yeni",
          theme: "minimal-light",
        }),
      )

      expect(res.status).toBe(409)
    })
  })

  // ─── Plan 2.5.2 — PATCH /api/portfolio/[id] ─────────────────────────
  describe("PATCH /api/portfolio/[id]", () => {
    it("200 on successful update", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      vi.mocked(db.select).mockReturnValue(
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
      vi.mocked(db.update).mockReturnValue(
        chainable([
          {
            id: PORTFOLIO_ID,
            userId: USER_ID,
            slug: "demo",
            theme: "minimal-dark",
            isPublished: false,
          },
        ]) as never,
      )

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/portfolio/${PORTFOLIO_ID}`,
          "PATCH",
          { theme: "minimal-dark" },
        ),
        { params: Promise.resolve({ id: PORTFOLIO_ID }) },
      )

      expect(res.status).toBe(200)
    })

    it("403 when user doesn't own portfolio", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
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

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/portfolio/${PORTFOLIO_ID}`,
          "PATCH",
          { theme: "minimal-dark" },
        ),
        { params: Promise.resolve({ id: PORTFOLIO_ID }) },
      )

      expect(res.status).toBe(403)
    })

    it("401 when unauthenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthenticationError("Unauthorized"))

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/portfolio/${PORTFOLIO_ID}`,
          "PATCH",
          { theme: "minimal-dark" },
        ),
        { params: Promise.resolve({ id: PORTFOLIO_ID }) },
      )

      expect(res.status).toBe(401)
    })
  })

  // ─── Plan 2.5.2 — GET /api/portfolio/check-slug ─────────────────────
  describe("GET /api/portfolio/check-slug", () => {
    it("400 when slug query param is missing", async () => {
      const res = await checkSlugGET(
        new Request("http://localhost/api/portfolio/check-slug"),
      )
      expect(res.status).toBe(400)
    })

    it("returns { available: true } for free slug", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      const res = await checkSlugGET(
        new Request(
          "http://localhost/api/portfolio/check-slug?slug=yeni-slug",
        ),
      )

      expect(res.status).toBe(200)
      const body = (await res.json()) as { available: boolean }
      expect(body.available).toBe(true)
    })

    it("returns { available: false } for reserved slug", async () => {
      const res = await checkSlugGET(
        new Request("http://localhost/api/portfolio/check-slug?slug=admin"),
      )

      expect(res.status).toBe(200)
      const body = (await res.json()) as { available: boolean }
      expect(body.available).toBe(false)
    })
  })

  // ─── Plan 2.5.2 — GET /api/portfolio/public/[slug] ──────────────────
  describe("GET /api/portfolio/public/[slug]", () => {
    it("200 with portfolio data when published", async () => {
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
              ownerBio: null,
              ownerAvatarUrl: null,
            },
          ]) as never
        }
        // Project ve link sorguları için array dönüş
        const c: Record<string, unknown> = {
          from: vi.fn(() => c),
          where: vi.fn(() => Promise.resolve([])),
        }
        return c as never
      }) as never)

      const res = await publicGET(
        new Request("http://localhost/api/portfolio/public/demo"),
        { params: Promise.resolve({ slug: "demo" }) },
      )

      expect(res.status).toBe(200)
      const body = (await res.json()) as { slug: string }
      expect(body.slug).toBe("demo")
    })

    it("404 when portfolio not found or not published", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      const res = await publicGET(
        new Request("http://localhost/api/portfolio/public/yok"),
        { params: Promise.resolve({ slug: "yok" }) },
      )

      expect(res.status).toBe(404)
    })
  })
})