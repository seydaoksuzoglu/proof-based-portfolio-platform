import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── Mock'lar (hoist) ─────────────────────────────────────────
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

import { ProjectController } from "@/lib/controllers/project-controller"
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

/**
 * Drizzle select sırasının her çağrısı için ayrı dönüş yapılandırması.
 * createProject/updateProject/etc. iç içe iki select çağırıyor:
 *   1) portfolio ownership lookup
 *   2) (sadece project üzerinden update/delete) önce project lookup
 * Sıralama controller'ın akışına göre ayarlanmalı.
 */
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
const PROJECT_ID = "project-789"
const SLUG = "demo"

const PORTFOLIO_ROW = {
  id: PORTFOLIO_ID,
  slug: SLUG,
  userId: USER_ID,
}
const FOREIGN_PORTFOLIO_ROW = {
  id: PORTFOLIO_ID,
  slug: SLUG,
  userId: OTHER_USER,
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

describe("ProjectController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Plan 3.1.1 — createProject ────────────────────────────
  describe("createProject", () => {
    it("yeni proje oluşturur (sahiplik OK)", async () => {
      mockSelectSequence([[PORTFOLIO_ROW]])
      vi.mocked(db.insert).mockReturnValue(
        chainable([{ ...PROJECT_ROW, title: "Yeni" }]) as never,
      )

      const result = await ProjectController.createProject(
        PORTFOLIO_ID,
        USER_ID,
        {
          title: "Yeni",
          description: "",
          imageUrl: "",
          demoUrl: "",
          githubUrl: "",
        },
      )

      expect(result.title).toBe("Yeni")
      expect(result.portfolioId).toBe(PORTFOLIO_ID)
    })

    it("portfolio yoksa NotFoundError", async () => {
      mockSelectSequence([[]])

      await expect(
        ProjectController.createProject(PORTFOLIO_ID, USER_ID, {
          title: "X",
          description: "",
          imageUrl: "",
          demoUrl: "",
          githubUrl: "",
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("başkasının portfolio'suna proje eklemeyi reddeder (AuthorizationError)", async () => {
      mockSelectSequence([[FOREIGN_PORTFOLIO_ROW]])

      await expect(
        ProjectController.createProject(PORTFOLIO_ID, USER_ID, {
          title: "X",
          description: "",
          imageUrl: "",
          demoUrl: "",
          githubUrl: "",
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  // ─── Plan 3.1.2 — updateProject ────────────────────────────
  describe("updateProject", () => {
    it("sahip kullanıcı için günceller", async () => {
      // 1) project lookup, 2) portfolio ownership
      mockSelectSequence([[PROJECT_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...PROJECT_ROW, title: "Güncel" }]) as never,
      )

      const result = await ProjectController.updateProject(
        PROJECT_ID,
        USER_ID,
        {
          title: "Güncel",
          description: "",
          imageUrl: "",
          demoUrl: "",
          githubUrl: "",
        },
      )

      expect(result.title).toBe("Güncel")
    })

    it("proje yoksa NotFoundError", async () => {
      mockSelectSequence([[]])

      await expect(
        ProjectController.updateProject(PROJECT_ID, USER_ID, {
          title: "X",
          description: "",
          imageUrl: "",
          demoUrl: "",
          githubUrl: "",
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it("başkasının projesini güncellemeyi reddeder", async () => {
      mockSelectSequence([[PROJECT_ROW], [FOREIGN_PORTFOLIO_ROW]])

      await expect(
        ProjectController.updateProject(PROJECT_ID, USER_ID, {
          title: "X",
          description: "",
          imageUrl: "",
          demoUrl: "",
          githubUrl: "",
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  // ─── Plan 3.1.3 — deleteProject ────────────────────────────
  describe("deleteProject", () => {
    it("sahip kullanıcı için siler", async () => {
      mockSelectSequence([[PROJECT_ROW], [PORTFOLIO_ROW]])
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      } as never)

      await expect(
        ProjectController.deleteProject(PROJECT_ID, USER_ID),
      ).resolves.toBeUndefined()
    })

    it("başkasının projesini silmeyi reddeder", async () => {
      mockSelectSequence([[PROJECT_ROW], [FOREIGN_PORTFOLIO_ROW]])

      await expect(
        ProjectController.deleteProject(PROJECT_ID, USER_ID),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  // ─── Plan 3.1.4 — toggleVisibility ─────────────────────────
  describe("toggleVisibility", () => {
    it("isVisible'i true'dan false'a çevirir", async () => {
      mockSelectSequence([
        [{ ...PROJECT_ROW, isVisible: true }],
        [PORTFOLIO_ROW],
      ])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...PROJECT_ROW, isVisible: false }]) as never,
      )

      const result = await ProjectController.toggleVisibility(
        PROJECT_ID,
        USER_ID,
      )
      expect(result.isVisible).toBe(false)
    })

    it("isVisible'i false'tan true'ya çevirir", async () => {
      mockSelectSequence([
        [{ ...PROJECT_ROW, isVisible: false }],
        [PORTFOLIO_ROW],
      ])
      vi.mocked(db.update).mockReturnValue(
        chainable([{ ...PROJECT_ROW, isVisible: true }]) as never,
      )

      const result = await ProjectController.toggleVisibility(
        PROJECT_ID,
        USER_ID,
      )
      expect(result.isVisible).toBe(true)
    })

    it("başkasının projesinde reddeder", async () => {
      mockSelectSequence([[PROJECT_ROW], [FOREIGN_PORTFOLIO_ROW]])

      await expect(
        ProjectController.toggleVisibility(PROJECT_ID, USER_ID),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })
  })

  // ─── Plan 3.4.2 — getProjectsByUser ────────────────────────
  describe("getProjectsByUser", () => {
    it("portföyü yoksa boş dizi döner", async () => {
      mockSelectSequence([[]])
      await expect(
        ProjectController.getProjectsByUser(USER_ID),
      ).resolves.toEqual([])
    })

    it("kullanıcının projelerini döner", async () => {
      mockSelectSequence([
        [{ id: PORTFOLIO_ID }],
        [PROJECT_ROW, { ...PROJECT_ROW, id: "p2", title: "Proje 2" }],
      ])

      const result = await ProjectController.getProjectsByUser(USER_ID)
      expect(result).toHaveLength(2)
    })
  })
})
