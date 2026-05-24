import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
import {
  POST as createPOST,
  GET as listGET,
} from "@/app/api/links/route"
import {
  PATCH as updatePATCH,
  DELETE as deleteDELETE,
} from "@/app/api/links/[id]/route"

const USER_ID = "user-123"
const PORTFOLIO_ID = "portfolio-456"
const LINK_ID = "link-789"

const PORTFOLIO_ROW = { id: PORTFOLIO_ID, slug: "demo", userId: USER_ID }
const FOREIGN_PORTFOLIO_ROW = {
  id: PORTFOLIO_ID,
  slug: "demo",
  userId: "user-OTHER",
}
const LINK_ROW = {
  id: LINK_ID,
  portfolioId: PORTFOLIO_ID,
  title: "GitHub",
  url: "https://github.com/seyda",
  icon: "github",
}

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
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(finalValue)),
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve(finalValue)),
    set: vi.fn(() => chain),
    orderBy: vi.fn(() => Promise.resolve(finalValue)),
  }
  return chain
}

function mockSelectSequence(returns: unknown[][]) {
  let i = 0
  vi.mocked(db.select).mockImplementation((() => {
    const value = returns[i] ?? []
    i++
    return chainable(value) as never
  }) as never)
}

const VALID_LINK_BODY = {
  title: "GitHub",
  url: "https://github.com/seyda",
  icon: "",
}

describe("Links API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 3.4.6 — POST /api/links ───────────────────────────
  describe("POST /api/links", () => {
    it("201 başarılı + icon otomatik atanır", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW]])

      let capturedIcon: string | undefined
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn((vals: { icon: string }) => {
          capturedIcon = vals.icon
          return {
            returning: vi.fn(() =>
              Promise.resolve([{ ...LINK_ROW, icon: vals.icon }]),
            ),
          }
        }),
      } as never)

      const res = await createPOST(
        jsonRequest("http://localhost/api/links", "POST", VALID_LINK_BODY),
      )

      expect(res.status).toBe(201)
      expect(capturedIcon).toBe("github")
    })

    it("401 oturum yoksa", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new AuthenticationError("Unauthorized"),
      )

      const res = await createPOST(
        jsonRequest("http://localhost/api/links", "POST", VALID_LINK_BODY),
      )

      expect(res.status).toBe(401)
    })

    it("400 portfolio yoksa", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[]])

      const res = await createPOST(
        jsonRequest("http://localhost/api/links", "POST", VALID_LINK_BODY),
      )

      expect(res.status).toBe(400)
    })

    it("400 http:// URL'i reddeder", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PORTFOLIO_ROW]])

      const res = await createPOST(
        jsonRequest("http://localhost/api/links", "POST", {
          ...VALID_LINK_BODY,
          url: "http://example.com",
        }),
      )

      expect(res.status).toBe(400)
    })

    it("400 boş title'ı reddeder", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PORTFOLIO_ROW]])

      const res = await createPOST(
        jsonRequest("http://localhost/api/links", "POST", {
          ...VALID_LINK_BODY,
          title: "",
        }),
      )

      expect(res.status).toBe(400)
    })
  })

  // ─── Plan 3.4.7 — GET /api/links ────────────────────────────
  describe("GET /api/links", () => {
    it("200 kullanıcının linkleri", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[{ id: PORTFOLIO_ID }], [LINK_ROW]])

      const res = await listGET()

      expect(res.status).toBe(200)
      const body = (await res.json()) as unknown[]
      expect(body).toHaveLength(1)
    })

    it("401 oturum yoksa", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new AuthenticationError("Unauthorized"),
      )

      const res = await listGET()
      expect(res.status).toBe(401)
    })
  })

  // ─── Plan 3.4.8 — PATCH /api/links/[id] ─────────────────────
  describe("PATCH /api/links/[id]", () => {
    it("200 başarılı güncelleme", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[LINK_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...LINK_ROW, title: "Güncel" }]) as never,
      )

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/links/${LINK_ID}`,
          "PATCH",
          { ...VALID_LINK_BODY, title: "Güncel" },
        ),
        { params: Promise.resolve({ id: LINK_ID }) },
      )

      expect(res.status).toBe(200)
    })

    it("403 başkasının linkini güncelleme denemesi", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[LINK_ROW], [FOREIGN_PORTFOLIO_ROW]])

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/links/${LINK_ID}`,
          "PATCH",
          VALID_LINK_BODY,
        ),
        { params: Promise.resolve({ id: LINK_ID }) },
      )

      expect(res.status).toBe(403)
    })

    it("404 link yoksa", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[]])

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/links/${LINK_ID}`,
          "PATCH",
          VALID_LINK_BODY,
        ),
        { params: Promise.resolve({ id: LINK_ID }) },
      )

      expect(res.status).toBe(404)
    })
  })

  // ─── Plan 3.4.9 — DELETE /api/links/[id] ────────────────────
  describe("DELETE /api/links/[id]", () => {
    it("204 başarılı silme", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[LINK_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      } as never)

      const res = await deleteDELETE(
        jsonRequest(`http://localhost/api/links/${LINK_ID}`, "DELETE"),
        { params: Promise.resolve({ id: LINK_ID }) },
      )

      expect(res.status).toBe(204)
    })

    it("403 başkasının linkini silmeye çalışırsa", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[LINK_ROW], [FOREIGN_PORTFOLIO_ROW]])

      const res = await deleteDELETE(
        jsonRequest(`http://localhost/api/links/${LINK_ID}`, "DELETE"),
        { params: Promise.resolve({ id: LINK_ID }) },
      )

      expect(res.status).toBe(403)
    })
  })
})
