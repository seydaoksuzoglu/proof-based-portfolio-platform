import { beforeEach, describe, expect, it, vi } from "vitest"

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

const USER_ID = "user-123"
const OTHER_USER = "user-OTHER"
const PORTFOLIO_ID = "portfolio-456"
const LINK_ID = "link-789"

const PORTFOLIO_ROW = { id: PORTFOLIO_ID, slug: "demo", userId: USER_ID }
const FOREIGN_PORTFOLIO_ROW = {
  id: PORTFOLIO_ID,
  slug: "demo",
  userId: OTHER_USER,
}
const LINK_ROW = {
  id: LINK_ID,
  portfolioId: PORTFOLIO_ID,
  title: "GitHub",
  url: "https://github.com/seyda",
  icon: "github",
}

describe("LinkController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 3.2.1 — createLink ───────────────────────────────
  describe("createLink", () => {
    it("URL'den ikonu otomatik eşler (icon verilmezse)", async () => {
      mockSelectSequence([[PORTFOLIO_ROW]])

      // insert().values() çağrısında verilen icon'u yakala
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

      const result = await LinkController.createLink(PORTFOLIO_ID, USER_ID, {
        title: "GitHub",
        url: "https://github.com/seyda",
        icon: "",
      })

      expect(capturedIcon).toBe("github")
      expect(result.icon).toBe("github")
    })

    it("explicit icon verilirse onu kullanır (auto-detect override)", async () => {
      mockSelectSequence([[PORTFOLIO_ROW]])

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

      await LinkController.createLink(PORTFOLIO_ID, USER_ID, {
        title: "GitHub",
        url: "https://github.com/seyda",
        icon: "custom-icon",
      })

      expect(capturedIcon).toBe("custom-icon")
    })

    it("bilinmeyen host için 'link' fallback'i kullanır", async () => {
      mockSelectSequence([[PORTFOLIO_ROW]])

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

      await LinkController.createLink(PORTFOLIO_ID, USER_ID, {
        title: "Site",
        url: "https://example.com",
        icon: "",
      })

      expect(capturedIcon).toBe("link")
    })

    it("portfolio yoksa NotFoundError", async () => {
      mockSelectSequence([[]])

      await expect(
        LinkController.createLink(PORTFOLIO_ID, USER_ID, {
          title: "X",
          url: "https://example.com",
          icon: "",
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("başkasının portfolio'suna link eklemeyi reddeder", async () => {
      mockSelectSequence([[FOREIGN_PORTFOLIO_ROW]])

      await expect(
        LinkController.createLink(PORTFOLIO_ID, USER_ID, {
          title: "X",
          url: "https://example.com",
          icon: "",
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  // ─── Plan 3.2.2 — updateLink ───────────────────────────────
  describe("updateLink", () => {
    it("sahip kullanıcı için günceller", async () => {
      mockSelectSequence([[LINK_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...LINK_ROW, title: "Güncel" }]) as never,
      )

      const result = await LinkController.updateLink(LINK_ID, USER_ID, {
        title: "Güncel",
        url: "https://github.com/seyda",
        icon: "github",
      })

      expect(result.title).toBe("Güncel")
    })

    it("link yoksa NotFoundError", async () => {
      mockSelectSequence([[]])

      await expect(
        LinkController.updateLink(LINK_ID, USER_ID, {
          title: "X",
          url: "https://example.com",
          icon: "",
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("başkasının linkini güncellemeyi reddeder", async () => {
      mockSelectSequence([[LINK_ROW], [FOREIGN_PORTFOLIO_ROW]])

      await expect(
        LinkController.updateLink(LINK_ID, USER_ID, {
          title: "X",
          url: "https://example.com",
          icon: "",
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  // ─── Plan 3.2.3 — deleteLink ───────────────────────────────
  describe("deleteLink", () => {
    it("sahip kullanıcı için siler", async () => {
      mockSelectSequence([[LINK_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      } as never)

      await expect(
        LinkController.deleteLink(LINK_ID, USER_ID),
      ).resolves.toBeUndefined()
    })

    it("başkasının linkini silmeyi reddeder", async () => {
      mockSelectSequence([[LINK_ROW], [FOREIGN_PORTFOLIO_ROW]])

      await expect(
        LinkController.deleteLink(LINK_ID, USER_ID),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })
})
