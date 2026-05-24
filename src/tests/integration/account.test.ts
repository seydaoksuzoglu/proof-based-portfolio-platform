import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar (hoist) ─────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
  },
}))

const destroyMock = vi.fn()

vi.mock("@/lib/auth", async () => {
  const mod = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")
  return {
    ...mod,
    getSession: vi.fn(async () => ({
      userId: "user-123",
      email: "demo@example.com",
      save: vi.fn(),
      destroy: destroyMock,
    })),
    requireAuth: vi.fn(),
  }
})

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}))

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { AuthenticationError } from "@/lib/errors"
import { DELETE as accountDELETE } from "@/app/api/account/route"

const USER_ID = "user-123"
const USER_ROW = { id: USER_ID, passwordHash: "hashed-correct-password" }

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function chainable(finalValue: unknown) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(finalValue)),
  }
  return chain
}

describe("DELETE /api/account (Plan §5.5.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Başarı ─────────────────────────────────────────────────
  it("204 — doğru parola ile hesap silinir ve session destroy edilir", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    vi.mocked(db.select).mockReturnValue(chainable([USER_ROW]) as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(() => Promise.resolve()),
    } as never)

    const res = await accountDELETE(jsonRequest({ password: "correct" }))

    expect(res.status).toBe(204)
    expect(destroyMock).toHaveBeenCalled()
    expect(db.delete).toHaveBeenCalled()
  })

  // ─── Yetkilendirme ──────────────────────────────────────────
  it("401 — oturum yok", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AuthenticationError("Unauthorized"),
    )

    const res = await accountDELETE(jsonRequest({ password: "any" }))

    expect(res.status).toBe(401)
    expect(destroyMock).not.toHaveBeenCalled()
  })

  // ─── Yanlış parola ──────────────────────────────────────────
  it("401 — yanlış parola hesabı silmez", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    vi.mocked(db.select).mockReturnValue(chainable([USER_ROW]) as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const res = await accountDELETE(jsonRequest({ password: "wrong" }))

    expect(res.status).toBe(401)
    expect(db.delete).not.toHaveBeenCalled()
    expect(destroyMock).not.toHaveBeenCalled()
  })

  // ─── Zod validasyon ─────────────────────────────────────────
  it("400 — boş parola reddedilir", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })

    const res = await accountDELETE(jsonRequest({ password: "" }))

    expect(res.status).toBe(400)
  })

  it("400 — password alanı eksikse", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })

    const res = await accountDELETE(jsonRequest({}))

    expect(res.status).toBe(400)
  })

  // ─── Edge case: user silinmiş (session geçerli) ─────────────
  it("404 — kullanıcı DB'de yoksa", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      email: "demo@example.com",
    })
    vi.mocked(db.select).mockReturnValue(chainable([]) as never)

    const res = await accountDELETE(jsonRequest({ password: "any" }))

    expect(res.status).toBe(404)
  })
})
