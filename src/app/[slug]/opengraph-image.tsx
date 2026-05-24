/**
 * Plan 5.3.5 — Public portföy için dinamik OG image.
 * Her portföy için kendi adı/bio/slug ile 1200×630 social card üretir.
 * WhatsApp / Twitter / LinkedIn / Slack vb. link önizlemelerinde gösterilir.
 *
 * Cache: Public sayfa ISR'ı (revalidate=60) ile aynı stratejide; Next.js otomatik.
 */

import { ImageResponse } from "next/og"

import { PortfolioController } from "@/lib/controllers/portfolio-controller"

export const runtime = "nodejs" // Drizzle/pg için Node runtime
export const alt = "Portfolio profile card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface ImageProps {
  params: Promise<{ slug: string }>
}

export default async function OpengraphImage({ params }: ImageProps) {
  const { slug } = await params

  let portfolio
  try {
    portfolio = await PortfolioController.getPublicPortfolio(slug)
  } catch {
    return defaultImage()
  }

// Avatar'ı server-side base64 olarak çek (CORS/fail için güvenli)
let avatarDataUrl: string | null = null
if (portfolio.owner.avatarUrl) {
try {
    const res = await fetch(portfolio.owner.avatarUrl, { cache: "force-cache" })
    if (res.ok) {
    const contentType = res.headers.get("content-type") ?? "image/png"
    if (contentType.startsWith("image/")) {
        const buf = await res.arrayBuffer()
        const base64 = Buffer.from(buf).toString("base64")
        avatarDataUrl = `data:${contentType};base64,${base64}`
    }
    }
} catch {
    // Avatar yüklenemedi, initials fallback'i kullanılacak
}
}


  const fullName = portfolio.owner.fullName ?? slug
  const bio = portfolio.owner.bio ?? "Proof-Based Portfolio"
  const initials = (portfolio.owner.fullName ?? slug)
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Tema temelli arka plan rengi seç (page.tsx ile tutarlı)
  const isDark =
    portfolio.theme === "minimal-dark" ||
    portfolio.theme === "graphite" ||
    portfolio.theme === "midnight"
  const bg = isDark ? "#0a0a0a" : "#fafaf9"
  const fg = isDark ? "#fafafa" : "#0a0a0a"
  const accent = isDark ? "#a78bfa" : "#4f46e5"
  const muted = isDark ? "#a1a1aa" : "#71717a"
  const avatarBg = isDark ? "#1a1a1d" : "#e4e4e7"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          padding: 80,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Üst kısım — Avatar + Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
          }}
        >
        {/* Avatar (initials fallback) */}
        <div
        style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 700,
            color: muted,
            flexShrink: 0,
        }}
        >
        {initials || "?"}
        </div>


          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: fg,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {truncate(fullName, 26)}
            </div>
            <div
              style={{
                fontSize: 32,
                color: muted,
                lineHeight: 1.3,
              }}
            >
              {truncate(bio, 80)}
            </div>
          </div>
        </div>

        {/* Alt kısım — URL + brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${avatarBg}`,
            paddingTop: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 28,
              color: fg,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: accent,
              }}
            />
            proofportfolio.com/{slug}
          </div>
          <div
            style={{
              fontSize: 24,
              color: muted,
              fontWeight: 500,
            }}
          >
            ProofPortfolio
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function defaultImage() {
  // Portfolio bulunamadı / yayında değil: jenerik fallback
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fafaf9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#0a0a0a",
            letterSpacing: "-0.02em",
          }}
        >
          ProofPortfolio
        </div>
        <div
          style={{ fontSize: 36, color: "#71717a", marginTop: 16 }}
        >
          Kanıt temelli portföy platformu
        </div>
      </div>
    ),
    { ...size },
  )
}
