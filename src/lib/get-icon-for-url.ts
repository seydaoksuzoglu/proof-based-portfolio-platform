/**
 * Plan 3.3.1 — Host bazlı otomatik ikon eşleştirme.
 * URL'in hostname'ine bakarak bilinen platformlar için ikon adı döner.
 * İkon adları lucide-react ikon kütüphanesindeki veya UI'da kullanılan string id'leridir.
 */

const HOST_ICON_MAP: Record<string, string> = {
  "github.com": "github",
  "www.github.com": "github",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "twitter.com": "twitter",
  "www.twitter.com": "twitter",
  "x.com": "twitter",
  "www.x.com": "twitter",
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "dribbble.com": "dribbble",
  "www.dribbble.com": "dribbble",
  "behance.net": "behance",
  "www.behance.net": "behance",
  "medium.com": "medium",
  "www.medium.com": "medium",
  "dev.to": "dev-to",
  "stackoverflow.com": "stack-overflow",
  "www.stackoverflow.com": "stack-overflow",
  "codepen.io": "codepen",
  "www.codepen.io": "codepen",
}

export function getIconForUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return HOST_ICON_MAP[hostname] ?? "link"
  } catch {
    return "link"
  }
}
