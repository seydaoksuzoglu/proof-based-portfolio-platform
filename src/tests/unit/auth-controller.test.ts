import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar (import'lardan önce hoist edilir) ──────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(async () => ({
    userId: undefined,
    email: undefined,
    save: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
  buildPasswordResetEmail: vi.fn(() => ({
    subject: "subj",
    html: "html",
  })),
}))

import { AuthController } from "@/lib/controllers/auth-controller"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from "@/lib/errors"

// Drizzle chainable mock helper
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

describe("AuthController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 1.6.1 #1 — hashPassword round-trip ───────────────────────
  it("hashPassword + verifyPassword: round-trip works", async () => {
    const plain = "password123"
    const hash = await AuthController.hashPassword(plain)

    expect(hash).not.toBe(plain)
    expect(hash.startsWith("$2")).toBe(true) // bcrypt prefix
    expect(await AuthController.verifyPassword(plain, hash)).toBe(true)
  })

  // ─── Plan 1.6.1 #2 — verifyPassword wrong returns false ────────────
  it("verifyPassword: returns false for wrong password", async () => {
    const hash = await AuthController.hashPassword("correct")
    expect(await AuthController.verifyPassword("wrong", hash)).toBe(false)
  })

  // ─── Plan 1.6.1 #3 — register: conflict on duplicate email ─────────
  it("register: throws ConflictError when email exists", async () => {
    vi.mocked(db.select).mockReturnValue(
      chainable([{ id: "existing-id" }]) as never,
    )

    await expect(
      AuthController.register({
        email: "test@example.com",
        password: "password123",
        fullName: "Test",
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it("register: success creates user and saves session", async () => {
    vi.mocked(db.select).mockReturnValue(chainable([]) as never) // no existing
    vi.mocked(db.insert).mockReturnValue(
      chainable([{ id: "new-id", email: "test@example.com", fullName: "Test" }]) as never,
    )

    const sessionMock = { userId: undefined, email: undefined, save: vi.fn(), destroy: vi.fn() }
    vi.mocked(getSession).mockResolvedValue(sessionMock as never)

    const result = await AuthController.register({
      email: "test@example.com",
      password: "password123",
      fullName: "Test",
    })

    expect(result.id).toBe("new-id")
    expect(sessionMock.save).toHaveBeenCalled()
  })

  // ─── Plan 1.6.1 #4 — login: generic error (PRD §10.4) ──────────────
  it("login: throws AuthenticationError when email not found", async () => {
    vi.mocked(db.select).mockReturnValue(chainable([]) as never)

    await expect(
      AuthController.login({ email: "nobody@example.com", password: "x" }),
    ).rejects.toBeInstanceOf(AuthenticationError)
  })

  it("login: throws AuthenticationError when password wrong", async () => {
    const correctHash = await AuthController.hashPassword("correct")
    vi.mocked(db.select).mockReturnValue(
      chainable([{ id: "id1", email: "a@b.com", passwordHash: correctHash }]) as never,
    )

    await expect(
      AuthController.login({ email: "a@b.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(AuthenticationError)
  })

  // ─── PRD §3.3 — logout test (plan 1.6.1'de yok ama PRD zorunlu) ────
  it("logout: destroys session", async () => {
    const sessionMock = { userId: "u", email: "e", save: vi.fn(), destroy: vi.fn() }
    vi.mocked(getSession).mockResolvedValue(sessionMock as never)

    await AuthController.logout()
    expect(sessionMock.destroy).toHaveBeenCalled()
  })

  // ─── PRD §3.3 — requestPasswordReset: enumeration koruması ─────────
  it("requestPasswordReset: silently succeeds when email not found", async () => {
    vi.mocked(db.select).mockReturnValue(chainable([]) as never)

    await expect(
      AuthController.requestPasswordReset("nobody@example.com"),
    ).resolves.toBeUndefined()
  })

  // ─── PRD §3.3 — confirmPasswordReset: invalid token ────────────────
  it("confirmPasswordReset: throws ValidationError for invalid token", async () => {
    vi.mocked(db.select).mockReturnValue(chainable([]) as never) // no record

    await expect(
      AuthController.confirmPasswordReset({
        token: "invalid",
        newPassword: "newpassword123",
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
