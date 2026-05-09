import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
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

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
  buildPasswordResetEmail: vi.fn(() => ({ subject: "s", html: "h" })),
}))

import { db } from "@/lib/db"
import { getSession, requireAuth } from "@/lib/auth"
import { AuthenticationError } from "@/lib/errors"
import { POST as registerPOST } from "@/app/api/auth/register/route"
import { POST as loginPOST } from "@/app/api/auth/login/route"
import { POST as logoutPOST } from "@/app/api/auth/logout/route"
import { POST as resetRequestPOST } from "@/app/api/auth/reset-password/request/route"
import { POST as resetConfirmPOST } from "@/app/api/auth/reset-password/confirm/route"

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
  }
  return chain
}

describe("Auth API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue({
      userId: undefined,
      email: undefined,
      save: vi.fn(),
      destroy: vi.fn(),
    } as never)
  })

  // ─── Plan 1.6.2 — /api/auth/register ───────────────────────────────
  describe("POST /api/auth/register", () => {
    it("201 on success", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)
      vi.mocked(db.insert).mockReturnValue(
        chainable([{ id: "new-id", email: "a@b.com", fullName: "Test" }]) as never,
      )

      const res = await registerPOST(
        makeRequest({ email: "a@b.com", password: "password123", fullName: "Test" }),
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.email).toBe("a@b.com")
    })

    it("409 on duplicate email", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "existing" }]) as never,
      )

      const res = await registerPOST(
        makeRequest({ email: "a@b.com", password: "password123", fullName: "Test" }),
      )

      expect(res.status).toBe(409)
    })

    it("400 on invalid input (Zod)", async () => {
      const res = await registerPOST(
        makeRequest({ email: "not-email", password: "short", fullName: "" }),
      )

      expect(res.status).toBe(400)
    })
  })

  // ─── Plan 1.6.2 — /api/auth/login ──────────────────────────────────
  describe("POST /api/auth/login", () => {
    it("200 on success", async () => {
      const { AuthController } = await import("@/lib/controllers/auth-controller")
      const hash = await AuthController.hashPassword("correct123")

      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "u1", email: "a@b.com", passwordHash: hash }]) as never,
      )

      const res = await loginPOST(
        makeRequest({ email: "a@b.com", password: "correct123" }),
      )

      expect(res.status).toBe(200)
    })

    it("401 with generic message on wrong password", async () => {
      const { AuthController } = await import("@/lib/controllers/auth-controller")
      const hash = await AuthController.hashPassword("correct123")

      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "u1", email: "a@b.com", passwordHash: hash }]) as never,
      )

      const res = await loginPOST(
        makeRequest({ email: "a@b.com", password: "wrong" }),
      )

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe("Email or password incorrect")
    })

    it("401 generic when email not found (PRD §10.4)", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      const res = await loginPOST(
        makeRequest({ email: "nobody@example.com", password: "any" }),
      )

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe("Email or password incorrect")
    })
  })

  // ─── Plan 1.6.2 — /api/auth/logout ─────────────────────────────────
  describe("POST /api/auth/logout", () => {
    it("200 when authenticated", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ userId: "u1", email: "a@b.com" })

      const res = await logoutPOST()
      expect(res.status).toBe(200)
    })

    it("401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthenticationError("Unauthorized"))

      const res = await logoutPOST()
      expect(res.status).toBe(401)
    })
  })

  // ─── Plan 1.6.2 — /api/auth/reset-password/request ─────────────────
  describe("POST /api/auth/reset-password/request", () => {
    it("200 even when email does not exist (enumeration prevention)", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      const res = await resetRequestPOST(
        makeRequest({ email: "nobody@example.com" }),
      )

      expect(res.status).toBe(200)
    })

    it("200 when email exists", async () => {
      vi.mocked(db.select).mockReturnValue(
        chainable([{ id: "u1", email: "a@b.com" }]) as never,
      )
      vi.mocked(db.insert).mockReturnValue(chainable(undefined) as never)

      const res = await resetRequestPOST(makeRequest({ email: "a@b.com" }))
      expect(res.status).toBe(200)
    })
  })

  // ─── Plan 1.6.2 — /api/auth/reset-password/confirm ─────────────────
  describe("POST /api/auth/reset-password/confirm", () => {
    it("400 with invalid token", async () => {
      vi.mocked(db.select).mockReturnValue(chainable([]) as never)

      const res = await resetConfirmPOST(
        makeRequest({ token: "invalid", newPassword: "newpassword123" }),
      )

      expect(res.status).toBe(400)
    })
  })
})
