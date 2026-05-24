/**
 * Public portföy tema preset'leri.
 * Her tema'nın ID'si DB'ye yazılır (portfolio.theme).
 * CSS değişken tanımları globals.css içindeki [data-theme="..."] bloklarındadır.
 *
 * Yeni tema eklerken:
 *   1. Bu listeye objesi ekle
 *   2. globals.css'e [data-theme="<id>"] bloku ekle (8 değişken)
 *   3. ThemePreview için bg/accent Tailwind class'larını seç
 */
export interface PortfolioTheme {
  id: string
  name: string
  description: string
  /** Preview kartı arka planı (Tailwind class) */
  bg: string
  /** Preview kartı vurgu rengi (Tailwind class) */
  accent: string
}

export const PORTFOLIO_THEMES: PortfolioTheme[] = [
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Saf beyaz, indigo vurgu",
    bg: "bg-[#ffffff]",
    accent: "bg-[#4f46e5]",
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Soft siyah, viyola vurgu",
    bg: "bg-[#0a0a0a]",
    accent: "bg-[#a78bfa]",
  },
  {
    id: "mint",
    name: "Mint",
    description: "Açık nane, emerald vurgu",
    bg: "bg-[#ecfdf5]",
    accent: "bg-[#10b981]",
  },
  {
    id: "sky",
    name: "Sky",
    description: "Gök mavisi, royal blue vurgu",
    bg: "bg-[#eff6ff]",
    accent: "bg-[#2563eb]",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Gül pembesi, magenta vurgu",
    bg: "bg-[#fef2f7]",
    accent: "bg-[#db2777]",
  },
  {
    id: "amber",
    name: "Amber",
    description: "Krem altın, warm orange vurgu",
    bg: "bg-[#fffbeb]",
    accent: "bg-[#d97706]",
  },
]


/** Varsayılan tema — schema default'u ile aynı tutulmalı */
export const DEFAULT_THEME_ID = "minimal-light"

/** ID -> tema objesi (lookup) */
export const PORTFOLIO_THEME_MAP: Record<string, PortfolioTheme> =
  Object.fromEntries(PORTFOLIO_THEMES.map((t) => [t.id, t]))
