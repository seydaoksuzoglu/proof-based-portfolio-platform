import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar (hoist) ─────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}))

const sessionSave = vi.fn()
const sessionDestroy = vi.fn()

vi.mock("@/lib/auth", async () => {
  const mod = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")
  return {
    ...mod,
    getSession: vi.fn(async () => ({
      userId: undefined,
      email: undefined,
      save: sessionSave,
      destroy: sessionDestroy,
    })),
    requireAuth: vi.fn(),
  }
})

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
  buildPasswordResetEmail: vi.fn(() => ({ subject: "x", html: "y" })),
}))

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(async () => "hashed"),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

import { POST as registerPOST } from "@/app/api/auth/register/route"
import { POST as loginPOST } from "@/app/api/auth/login/route"
import { POST as portfolioPOST } from "@/app/api/portfolio/route"
import { POST as projectPOST } from "@/app/api/projects/route"
import { POST as linkPOST } from "@/app/api/links/route"
import { PATCH as portfolioPATCH } from "@/app/api/portfolio/[id]/route"
import { GET as publicGET } from "@/app/api/portfolio/public/[slug]/route"
import { DELETE as accountDELETE } from "@/app/api/account/route"

// ─── Sabitler ─────────────────────────────────────────────────
const USER_ID = "user-123"
const PORTFOLIO_ID = "portfolio-456"
const PROJECT_ID = "project-789"
const LINK_ID = "link-000"
const SLUG = "smoke-demo"
const EMAIL = "demo@example.com"
const PASSWORD = "Sifre1234!"

const USER_ROW = {
  id: USER_ID,
  email: EMAIL,
  passwordHash: "hashed",
  fullName: null,
  bio: null,
  avatarUrl: null,
  createdAt: new Date(),
}

const PORTFOLIO_ROW = {
  id: PORTFOLIO_ID,
  userId: USER_ID,
  slug: SLUG,
  theme: "minimal-light",
  isPublished: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const SESSION = { userId: USER_ID, email: EMAIL }

// ─── Helpers ──────────────────────────────────────────────────
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
    orderBy: vi.fn(() => Promise.resolve(finalValue)),
    then: (
      onFulfilled: (v: unknown) => unknown,
      onRejected?: (e: unknown) => unknown,
    ) => Promise.resolve(finalValue).then(onFulfilled, onRejected),
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

/**
 * Plan 5.5.2 — Tüm happy path'lerin ardışık çalışması.
 * Her test bağımsız mock kurar ama aynı sahte kullanıcı/portföy ID'lerini paylaşır.
 * Amaç: 8 ana endpoint'in en az başarı senaryosunda doğru status code döndürmesi.
 */
describe("Smoke Tests — Happy Path (Plan §5.5.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
  })

  // UC-1 — Kayıt
  it("[UC-1] POST /api/auth/register → 201", async () => {
    mockSelectSequence([[]]) // email çakışması yok
    vi.mocked(db.insert).mockReturnValue(chainable([USER_ROW]) as never)

    const res = await registerPOST(
      jsonRequest("http://localhost/api/auth/register", "POST", {
        email: EMAIL,
        password: PASSWORD,
        fullName: "Demo User",
      }),
    )

    expect(res.status).toBe(201)
    expect(sessionSave).toHaveBeenCalled()
  })

  // UC-2 — Giriş
  it("[UC-2] POST /api/auth/login → 200", async () => {
    mockSelectSequence([[USER_ROW]])

    const res = await loginPOST(
      jsonRequest("http://localhost/api/auth/login", "POST", {
        email: EMAIL,
        password: PASSWORD,
      }),
    )

    expect(res.status).toBe(200)
    expect(sessionSave).toHaveBeenCalled()
  })

  // UC-4 — Portföy oluşturma
  it("[UC-4] POST /api/portfolio → 201", async () => {
    vi.mocked(requireAuth).mockResolvedValue(SESSION)
    mockSelectSequence([[]]) // kullanıcının portföyü yok
    vi.mocked(db.insert).mockReturnValue(chainable([PORTFOLIO_ROW]) as never)

    const res = await portfolioPOST(
      jsonRequest("http://localhost/api/portfolio", "POST", {
        slug: SLUG,
        theme: "minimal-light",
      }),
    )

    expect(res.status).toBe(201)
  })

  // UC-3 — Proje ekleme
  it("[UC-3] POST /api/projects → 201", async () => {
    vi.mocked(requireAuth).mockResolvedValue(SESSION)
    mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW]])
    vi.mocked(db.insert).mockReturnValue(
      chainable([
        {
          id: PROJECT_ID,
          portfolioId: PORTFOLIO_ID,
          title: "Smoke Proje",
          isVisible: true,
        },
      ]) as never,
    )

    const res = await projectPOST(
      jsonRequest("http://localhost/api/projects", "POST", {
        title: "Smoke Proje",
        description: "",
        imageUrl: "",
        demoUrl: "",
        githubUrl: "",
      }),
    )

    expect(res.status).toBe(201)
  })

  // Link ekleme (UC-13/14 destek)
  it("POST /api/links → 201", async () => {
    vi.mocked(requireAuth).mockResolvedValue(SESSION)
    mockSelectSequence([[PORTFOLIO_ROW], [PORTFOLIO_ROW]])
    vi.mocked(db.insert).mockReturnValue(
      chainable([
        {
          id: LINK_ID,
          portfolioId: PORTFOLIO_ID,
          title: "GitHub",
          url: "https://github.com/seyda",
          icon: "github",
        },
      ]) as never,
    )

    const res = await linkPOST(
      jsonRequest("http://localhost/api/links", "POST", {
        title: "GitHub",
        url: "https://github.com/seyda",
        icon: "",
      }),
    )

    expect(res.status).toBe(201)
  })

  // UC-7 — Yayınlama
  it("[UC-7] PATCH /api/portfolio/[id] (publish=true) → 200", async () => {
    vi.mocked(requireAuth).mockResolvedValue(SESSION)
    mockSelectSequence([[PORTFOLIO_ROW]])
    vi.mocked(db.update).mockReturnValue(
      chainable([{ ...PORTFOLIO_ROW, isPublished: true }]) as never,
    )

    const res = await portfolioPATCH(
      jsonRequest(
        `http://localhost/api/portfolio/${PORTFOLIO_ID}`,
        "PATCH",
        { isPublished: true },
      ),
      { params: Promise.resolve({ id: PORTFOLIO_ID }) },
    )

    expect(res.status).toBe(200)
  })

  // UC-10 — Public görüntüleme
  it("[UC-10] GET /api/portfolio/public/[slug] → 200", async () => {
    mockSelectSequence([
      [
        {
          portfolio: { ...PORTFOLIO_ROW, isPublished: true },
          ownerFullName: "Demo User",
          ownerBio: null,
          ownerAvatarUrl: null,
        },
      ],
      [], // projects
      [], // links
    ])

    const res = await publicGET(
      new Request(`http://localhost/api/portfolio/public/${SLUG}`),
      { params: Promise.resolve({ slug: SLUG }) },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { slug: string }
    expect(body.slug).toBe(SLUG)
  })

  // UC-12 — Hesap silme
  it("[UC-12] DELETE /api/account → 204", async () => {
    vi.mocked(requireAuth).mockResolvedValue(SESSION)
    mockSelectSequence([[{ id: USER_ID, passwordHash: "hashed" }]])
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(() => Promise.resolve()),
    } as never)

    const res = await accountDELETE(
      jsonRequest("http://localhost/api/account", "DELETE", {
        password: PASSWORD,
      }),
    )

    expect(res.status).toBe(204)
    expect(sessionDestroy).toHaveBeenCalled()
  })
})
