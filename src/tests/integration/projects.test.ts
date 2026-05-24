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
} from "@/app/api/projects/route"
import {
  PATCH as updatePATCH,
  DELETE as deleteDELETE,
} from "@/app/api/projects/[id]/route"
import { PATCH as visibilityPATCH } from "@/app/api/projects/[id]/visibility/route"

const USER_ID = "user-123"
const PORTFOLIO_ID = "portfolio-456"
const PROJECT_ID = "project-789"

const PORTFOLIO_ROW = { id: PORTFOLIO_ID, slug: "demo", userId: USER_ID }
const FOREIGN_PORTFOLIO_ROW = {
  id: PORTFOLIO_ID,
  slug: "demo",
  userId: "user-OTHER",
}
const PROJECT_ROW = {
  id: PROJECT_ID,
  portfolioId: PORTFOLIO_ID,
  title: "Proje 1",
  description: null,
  imageUrl: null,
  demoUrl: null,
  githubUrl: null,
  isVisible: true,
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

const VALID_PROJECT_BODY = {
  title: "Yeni Proje",
  description: "Açıklama",
  imageUrl: "",
  demoUrl: "",
  githubUrl: "",
}

describe("Projects API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 3.4.1 — POST /api/projects ────────────────────────
  describe("POST /api/projects", () => {
    it("201 başarılı oluşturma", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      // 1) getByUserId portfolio lookup, 2) createProject ownership lookup
      mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.insert).mockReturnValue(
        chainable([{ ...PROJECT_ROW, title: "Yeni Proje" }]) as never,
      )

      const res = await createPOST(
        jsonRequest(
          "http://localhost/api/projects",
          "POST",
          VALID_PROJECT_BODY,
        ),
      )

      expect(res.status).toBe(201)
      const body = (await res.json()) as { title: string }
      expect(body.title).toBe("Yeni Proje")
    })

    it("401 oturum yoksa", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new AuthenticationError("Unauthorized"),
      )

      const res = await createPOST(
        jsonRequest(
          "http://localhost/api/projects",
          "POST",
          VALID_PROJECT_BODY,
        ),
      )

      expect(res.status).toBe(401)
    })

    it("400 portfolio yoksa", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[]]) // portfolio yok

      const res = await createPOST(
        jsonRequest(
          "http://localhost/api/projects",
          "POST",
          VALID_PROJECT_BODY,
        ),
      )

      expect(res.status).toBe(400)
    })

    it("400 Zod validasyon hatası (boş title)", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PORTFOLIO_ROW]])

      const res = await createPOST(
        jsonRequest("http://localhost/api/projects", "POST", {
          ...VALID_PROJECT_BODY,
          title: "",
        }),
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
        jsonRequest("http://localhost/api/projects", "POST", {
          ...VALID_PROJECT_BODY,
          demoUrl: "http://example.com",
        }),
      )

      expect(res.status).toBe(400)
    })
  })

  // ─── Plan 3.4.2 — GET /api/projects ─────────────────────────
  describe("GET /api/projects", () => {
    it("200 kullanıcının projeleri", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[{ id: PORTFOLIO_ID }], [PROJECT_ROW]])

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

  // ─── Plan 3.4.3 — PATCH /api/projects/[id] ──────────────────
  describe("PATCH /api/projects/[id]", () => {
    it("200 başarılı güncelleme", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PROJECT_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...PROJECT_ROW, title: "Güncel" }]) as never,
      )

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}`,
          "PATCH",
          { ...VALID_PROJECT_BODY, title: "Güncel" },
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(200)
    })

    it("403 başkasının projesini güncelleme denemesi", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PROJECT_ROW], [FOREIGN_PORTFOLIO_ROW]])

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}`,
          "PATCH",
          VALID_PROJECT_BODY,
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(403)
    })

    it("404 proje yoksa", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[]])

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}`,
          "PATCH",
          VALID_PROJECT_BODY,
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(404)
    })

    it("401 oturum yoksa", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new AuthenticationError("Unauthorized"),
      )

      const res = await updatePATCH(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}`,
          "PATCH",
          VALID_PROJECT_BODY,
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(401)
    })
  })

  // ─── Plan 3.4.4 — DELETE /api/projects/[id] ─────────────────
  describe("DELETE /api/projects/[id]", () => {
    it("204 başarılı silme", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PROJECT_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      } as never)

      const res = await deleteDELETE(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}`,
          "DELETE",
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(204)
    })

    it("403 başkasının projesini silmeye çalışırsa", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PROJECT_ROW], [FOREIGN_PORTFOLIO_ROW]])

      const res = await deleteDELETE(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}`,
          "DELETE",
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(403)
    })
  })

  // ─── Plan 3.4.5 — PATCH /api/projects/[id]/visibility ───────
  describe("PATCH /api/projects/[id]/visibility", () => {
    it("200 ve isVisible toggle eder", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([
        [{ ...PROJECT_ROW, isVisible: true }],
        [PORTFOLIO_ROW],
      ])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...PROJECT_ROW, isVisible: false }]) as never,
      )

      const res = await visibilityPATCH(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}/visibility`,
          "PATCH",
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(200)
      const body = (await res.json()) as { isVisible: boolean }
      expect(body.isVisible).toBe(false)
    })

    it("403 başkasının projesinde", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: USER_ID,
        email: "demo@example.com",
      })
      mockSelectSequence([[PROJECT_ROW], [FOREIGN_PORTFOLIO_ROW]])

      const res = await visibilityPATCH(
        jsonRequest(
          `http://localhost/api/projects/${PROJECT_ID}/visibility`,
          "PATCH",
        ),
        { params: Promise.resolve({ id: PROJECT_ID }) },
      )

      expect(res.status).toBe(403)
    })
  })
})
