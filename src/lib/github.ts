/**
 * Plan 4.2.1 — GitHub API client.
 * Public repo'ları çeker. GITHUB_TOKEN varsa Authorization header ekler,
 * yoksa anonim API kullanır (saatte 60 istek limiti).
 */

export interface GitHubRepo {
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  fork: boolean
}

/**
 * GitHub REST API ile kullanıcının public repo'larını çeker.
 * Fork'lar hariç tutulur (orijinal çalışmalar için).
 */
export async function fetchGitHubRepos(
  username: string,
): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&direction=desc`

  const res = await fetch(url, { headers, cache: "no-store" })

  if (res.status === 404) {
    throw new Error("GitHub user not found")
  }

  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining")
    if (remaining === "0") {
      throw new Error(
        "GitHub API rate limit exceeded. Please try again later.",
      )
    }
    throw new Error("GitHub API access denied")
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }

  const repos: GitHubRepo[] = await res.json()

  // Fork'ları hariç tut — sadece orijinal çalışmaları import et
  return repos.filter((r) => !r.fork)
}
