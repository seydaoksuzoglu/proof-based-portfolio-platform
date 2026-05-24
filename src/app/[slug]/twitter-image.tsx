/**
 * Plan 5.3.5 — Twitter Card image.
 * Boyut ve içerik OG image ile aynı (1200×630, summary_large_image).
 * runtime burada local olarak deklare edilmeli (re-export edilemez — Next.js statik analiz).
 */

export const runtime = "nodejs"

export { default, alt, size, contentType } from "./opengraph-image"