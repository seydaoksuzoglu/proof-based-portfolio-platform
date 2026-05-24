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

vi.mock("@/lib/github", () => ({
  fetchGitHubRepos: vi.fn(),
}))

import { ProjectController } from "@/lib/controllers/project-controller"
import { db } from "@/lib/db"
import { fetchGitHubRepos } from "@/lib/github"
import { AuthorizationError, NotFoundError } from "@/lib/errors"

// Drizzle chainable mock helper
// The chain is thenable so queries that end with .where() (no .limit()) resolve correctly.
function chainable(finalValue: unknown) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(finalValue)),
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve(finalValue)),
    set: vi.fn(() => chain),
    orderBy: vi.fn(() => Promise.resolve(finalValue)),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(finalValue)),
  }
  return chain
}

describe("ProjectController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createProject", () => {
    it("creates a project when portfolio ownership is valid", async () => {
      // getPortfolioForUser (select → from → where → limit)
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "test-slug", userId: "u1" }]) as never,
      )
      // insert → values → returning
      vi.mocked(db.insert).mockReturnValue(
        chainable([{
          id: "proj1",
          portfolioId: "p1",
          title: "Test Project",
          description: null,
          imageUrl: null,
          demoUrl: null,
          githubUrl: null,
          isVisible: true,
          createdAt: new Date(),
        }]) as never,
      )

      const result = await ProjectController.createProject("p1", "u1", {
        title: "Test Project",
      })

      expect(result.id).toBe("proj1")
      expect(result.title).toBe("Test Project")
    })

    it("throws AuthorizationError when user doesn't own portfolio", async () => {
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "test-slug", userId: "other-user" }]) as never,
      )

      await expect(
        ProjectController.createProject("p1", "u1", { title: "Test" }),
      ).rejects.toBeInstanceOf(AuthorizationError)
    })

    it("throws NotFoundError when portfolio doesn't exist", async () => {
      vi.mocked(db.select).mockReturnValueOnce(chainable([]) as never)

      await expect(
        ProjectController.createProject("p1", "u1", { title: "Test" }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe("toggleVisibility", () => {
    it("toggles isVisible from true to false", async () => {
      // getProjectWithOwnership: select project
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{
          id: "proj1",
          portfolioId: "p1",
          title: "Test",
          isVisible: true,
        }]) as never,
      )
      // getPortfolioForUser: select portfolio
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "u1" }]) as never,
      )
      // update → set → where → returning
      vi.mocked(db.update).mockReturnValue(
        chainable([{
          id: "proj1",
          isVisible: false,
        }]) as never,
      )

      const result = await ProjectController.toggleVisibility("proj1", "u1")
      expect(result.isVisible).toBe(false)
    })
  })

  describe("deleteProject", () => {
    it("deletes project with valid ownership", async () => {
      // select project
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "proj1", portfolioId: "p1" }]) as never,
      )
      // select portfolio
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "u1" }]) as never,
      )
      // delete
      vi.mocked(db.delete).mockReturnValue(
        chainable(undefined) as never,
      )

      await expect(
        ProjectController.deleteProject("proj1", "u1"),
      ).resolves.toBeUndefined()
    })
  })

  describe("importFromGitHub", () => {
    it("imports new repos and updates existing ones", async () => {
      // getPortfolioForUser
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([{ id: "p1", slug: "slug", userId: "u1" }]) as never,
      )

      // fetchGitHubRepos
      vi.mocked(fetchGitHubRepos).mockResolvedValue([
        {
          name: "new-repo",
          description: "A new repo",
          html_url: "https://github.com/user/new-repo",
          homepage: null,
          fork: false,
        },
        {
          name: "existing-repo",
          description: "Updated desc",
          html_url: "https://github.com/user/existing-repo",
          homepage: "https://example.com",
          fork: false,
        },
      ])

      // existing projects query
      vi.mocked(db.select).mockReturnValueOnce(
        chainable([
          {
            id: "proj1",
            portfolioId: "p1",
            githubUrl: "https://github.com/user/existing-repo",
            description: "Old desc",
            demoUrl: null,
          },
        ]) as never,
      )

      // update for existing
      vi.mocked(db.update).mockReturnValue(chainable(undefined) as never)
      // insert for new
      vi.mocked(db.insert).mockReturnValue(chainable(undefined) as never)

      const result = await ProjectController.importFromGitHub("p1", "u1", "user")
      expect(result.imported).toBe(1)
      expect(result.updated).toBe(1)
    })
  })
})
