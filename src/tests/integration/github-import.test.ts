import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar (hoist) ─────────────────────────────────────────
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
import { POST as importPOST } from "@/app/api/github/import/route"

const USER_ID = "user-123"
const PORTFOLIO_ID = "portfolio-456"
const PORTFOLIO_ROW = { id: PORTFOLIO_ID, slug: "demo", userId: USER_ID }

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    // Drizzle bazı sorgular .limit() çağırmadan await edilir (örn. existingProjects).
    // then ekleyerek chain'in kendisini "thenable" yapıyoruz — direkt await edilebilir.
    then: (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(finalValue).then(onFulfilled, onRejected),
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

function mockFetchResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response
}

const ORIGINAL_FETCH = global.fetch

describe("POST /api/github/import (Plan §4.4.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.fetch = ORIGINAL_FETCH
  })

  // ─── Yetkilendirme ──────────────────────────────────────────
  it("401 — oturum yok", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AuthenticationError("Unauthorized"),
    )

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "seyda",
      }),
    )

    expect(res.status).toBe(401)
  })

  // ─── Portföy gereksinimi ────────────────────────────────────
  it("400 — portföy yoksa", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    mockSelectSequence([[]]) // getByUserId → null

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "seyda",
      }),
    )

    expect(res.status).toBe(400)
  })

  // ─── Validasyon ─────────────────────────────────────────────
  it("400 — geçersiz GitHub kullanıcı adı (boş)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    mockSelectSequence([[PORTFOLIO_ROW]])

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "",
      }),
    )

    expect(res.status).toBe(400)
  })

  it("400 — geçersiz GitHub kullanıcı adı (özel karakter)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    mockSelectSequence([[PORTFOLIO_ROW]])

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "seyda!@#",
      }),
    )

    expect(res.status).toBe(400)
  })

  // ─── Başarılı import (yeni proje oluşturma) ─────────────────
  it("200 — yeni repo'lar import edilir", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })

    // 1) getByUserId, 2) getPortfolioForUser, 3) existingProjects
    mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW], []])

    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse([
        {
          name: "repo-1",
          description: "First",
          html_url: "https://github.com/seyda/repo-1",
          homepage: null,
          fork: false,
        },
        {
          name: "repo-2",
          description: null,
          html_url: "https://github.com/seyda/repo-2",
          homepage: "https://repo2.dev",
          fork: false,
        },
      ]),
    )

    vi.mocked(db.insert).mockReturnValue(chainable([]) as never)

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "seyda",
      }),
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { imported: number; updated: number }
    expect(body.imported).toBe(2)
    expect(body.updated).toBe(0)
  })

  // ─── Çakışma yönetimi (create vs update) ────────────────────
  it("200 — mevcut githubUrl varsa update, yoksa create", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })

    const existing = {
      id: "proj-1",
      portfolioId: PORTFOLIO_ID,
      title: "Existing Repo",
      description: "Eski açıklama",
      githubUrl: "https://github.com/seyda/existing",
      demoUrl: null,
      imageUrl: null,
      isVisible: true,
    }

    mockSelectSequence([
      [PORTFOLIO_ROW], // getByUserId
      [PORTFOLIO_ROW], // getPortfolioForUser
      [existing], // existingProjects
    ])

    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse([
        {
          name: "existing",
          description: "Yeni açıklama",
          html_url: "https://github.com/seyda/existing",
          homepage: null,
          fork: false,
        },
        {
          name: "new-repo",
          description: "Brand new",
          html_url: "https://github.com/seyda/new-repo",
          homepage: null,
          fork: false,
        },
      ]),
    )

    vi.mocked(db.update).mockReturnValue(chainable([]) as never)
    vi.mocked(db.insert).mockReturnValue(chainable([]) as never)

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "seyda",
      }),
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { imported: number; updated: number }
    expect(body.imported).toBe(1)
    expect(body.updated).toBe(1)
  })

  // ─── GitHub hata yönetimi ───────────────────────────────────
  it("404 — GitHub kullanıcısı yoksa", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW]])

    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ message: "Not Found" }, 404),
    )

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "yok-kullanici",
      }),
    )

    expect(res.status).toBe(404)
  })

  it("429 — rate limit aşıldıysa", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW]])

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ "x-ratelimit-remaining": "0" }),
      json: async () => ({ message: "rate limit exceeded" }),
    } as unknown as Response)

    const res = await importPOST(
      jsonRequest("http://localhost/api/github/import", {
        githubUsername: "seyda",
      }),
    )

    expect(res.status).toBe(429)
  })
})
