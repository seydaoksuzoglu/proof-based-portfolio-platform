import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar ──────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { LinkController } from "@/lib/controllers/link-controller"
import { db } from "@/lib/db"
import { AuthorizationError, NotFoundError } from "@/lib/errors"

// Drizzle chainable mock helper
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

describe("LinkController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createLink", () => {
    it("creates a link with auto-detected icon", async () => {
      // getPortfolioForUser
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "u1" }]) as never
      )
      // insert → values → returning
      vi.mocked(db.insert).mockReturnValue(
        chainable([
          {
            id: "l1",
            portfolioId: "p1",
            title: "GitHub",
            url: "https://github.com/user",
            icon: "github",
            createdAt: new Date(),
          },
        ]) as never
      )

      const result = await LinkController.createLink("p1", "u1", {
        title: "GitHub",
        url: "https://github.com/user",
      })

      expect(result.id).toBe("l1")
      expect(result.icon).toBe("github")
    })

    it("throws NotFoundError when portfolio doesn't exist", async () => {
      vi.mocked(db.select).mockReturnValueOnce(chainable([]) as never)

      await expect(
        LinkController.createLink("p1", "u1", {
          title: "Test",
          url: "https://example.com",
        })
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("throws AuthorizationError when user doesn't own portfolio", async () => {
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "other" }]) as never
      )

      await expect(
        LinkController.createLink("p1", "u1", {
          title: "Test",
          url: "https://example.com",
        })
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  describe("updateLink", () => {
    it("updates link with valid ownership", async () => {
      // getLinkWithOwnership: select link
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "l1", portfolioId: "p1" }]) as never
      )
      // getPortfolioForUser: select portfolio
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "u1" }]) as never
      )
      // update → set → where → returning
      vi.mocked(db.update).mockReturnValue(
        chainable([
          {
            id: "l1",
            title: "Updated",
            url: "https://linkedin.com/in/user",
            icon: "linkedin",
          },
        ]) as never
      )

      const result = await LinkController.updateLink("l1", "u1", {
        title: "Updated",
        url: "https://linkedin.com/in/user",
      })

      expect(result.title).toBe("Updated")
      expect(result.icon).toBe("linkedin")
    })
  })

  describe("deleteLink", () => {
    it("deletes link with valid ownership", async () => {
      // select link
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "l1", portfolioId: "p1" }]) as never
      )
      // select portfolio
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "u1" }]) as never
      )
      // delete
      vi.mocked(db.delete).mockReturnValue(chainable(undefined) as never)

      await expect(
        LinkController.deleteLink("l1", "u1")
      ).resolves.toBeUndefined()
    })
  })
})
