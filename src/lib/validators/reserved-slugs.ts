/**
 * Slug olarak kullanılamayacak rezerve kelimeler.
 * Sistem rotaları ve özel dizinlerle çakışmayı önler.
 */
export const RESERVED_SLUGS = [
  "api",
  "dashboard",
  "login",
  "register",
  "reset-password",
  "settings",
  "admin",
  "_next",
  "public",
  "app",
  "about",
  "terms",
  "privacy",
  "static",
  "assets",
] as const

export type ReservedSlug = (typeof RESERVED_SLUGS)[number]
