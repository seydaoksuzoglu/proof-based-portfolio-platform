import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fetchGitHubRepos } from "@/lib/github"

/**
 * Plan 4.4.3 — GitHub API client unit testleri.
 * fetch global'i mock'lanır; gerçek HTTP yok.
 */

const ORIGINAL_FETCH = global.fetch

function mockFetchResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  const status = init.status ?? 200
  const headers = new Headers(init.headers ?? {})

  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    json: async () => body,
  } as unknown as Response
}

describe("fetchGitHubRepos (Plan §4.2.1)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    delete process.env.GITHUB_TOKEN
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.fetch = ORIGINAL_FETCH
  })

  // ─── Başarı senaryoları ─────────────────────────────────────
  describe("başarı", () => {
    it("repo listesini döner, fork'ları hariç tutar", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse([
          {
            name: "my-repo",
            description: "Cool project",
            html_url: "https://github.com/seyda/my-repo",
            homepage: "https://my-repo.dev",
            fork: false,
          },
          {
            name: "forked-repo",
            description: "A fork",
            html_url: "https://github.com/seyda/forked-repo",
            homepage: null,
            fork: true, // hariç tutulmalı
          },
          {
            name: "another-repo",
            description: null,
            html_url: "https://github.com/seyda/another-repo",
            homepage: null,
            fork: false,
          },
        ]),
      )

      const repos = await fetchGitHubRepos("seyda")

      expect(repos).toHaveLength(2)
      expect(repos[0].name).toBe("my-repo")
      expect(repos[1].name).toBe("another-repo")
      expect(repos.find((r) => r.name === "forked-repo")).toBeUndefined()
    })

    it("null description'ı koruyarak döner", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse([
          {
            name: "no-desc",
            description: null,
            html_url: "https://github.com/seyda/no-desc",
            homepage: null,
            fork: false,
          },
        ]),
      )

      const [repo] = await fetchGitHubRepos("seyda")
      expect(repo.description).toBeNull()
    })

    it("boş repo listesi döndürebilir", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse([]))

      await expect(fetchGitHubRepos("seyda")).resolves.toEqual([])
    })
  })

  // ─── Auth header ────────────────────────────────────────────
  describe("Authorization header", () => {
    it("GITHUB_TOKEN tanımlıysa Bearer header ekler", async () => {
      process.env.GITHUB_TOKEN = "ghp_test_token"
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse([]))

      await fetchGitHubRepos("seyda")

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const init = callArgs[1] as RequestInit
      const headers = init.headers as Record<string, string>

      expect(headers.Authorization).toBe("Bearer ghp_test_token")
    })

    it("GITHUB_TOKEN yoksa Authorization header eklemez", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse([]))

      await fetchGitHubRepos("seyda")

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const init = callArgs[1] as RequestInit
      const headers = init.headers as Record<string, string>

      expect(headers.Authorization).toBeUndefined()
    })
  })

  // ─── URL kodlama ────────────────────────────────────────────
  describe("URL kodlama", () => {
    it("özel karakterli kullanıcı adlarını encode eder", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse([]))

      await fetchGitHubRepos("user@name") // gerçekçi değil ama encode testi

      const calledUrl = vi.mocked(global.fetch).mock.calls[0][0] as string
      expect(calledUrl).toContain("user%40name")
    })
  })

  // ─── Hata senaryoları ───────────────────────────────────────
  describe("hatalar", () => {
    it("404 → 'GitHub user not found'", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse({ message: "Not Found" }, { status: 404 }),
      )

      await expect(fetchGitHubRepos("yok")).rejects.toThrow(
        "GitHub user not found",
      )
    })

    it("403 + rate limit remaining=0 → rate limit hatası", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse(
          { message: "API rate limit exceeded" },
          { status: 403, headers: { "x-ratelimit-remaining": "0" } },
        ),
      )

      await expect(fetchGitHubRepos("seyda")).rejects.toThrow(/rate limit/i)
    })

    it("403 + rate limit remaining > 0 → access denied hatası", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse(
          { message: "Forbidden" },
          { status: 403, headers: { "x-ratelimit-remaining": "55" } },
        ),
      )

      await expect(fetchGitHubRepos("seyda")).rejects.toThrow(
        "GitHub API access denied",
      )
    })

    it("500 → jenerik 'GitHub API error' mesajı", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse({ message: "Server error" }, { status: 500 }),
      )

      await expect(fetchGitHubRepos("seyda")).rejects.toThrow(
        "GitHub API error: 500",
      )
    })
  })
})
