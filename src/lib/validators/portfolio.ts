import { z } from "zod"
import { RESERVED_SLUGS } from "./reserved-slugs"

/** Slug formatı: küçük harf, rakam, tire; 3-31 karakter; tireyle başlamaz */
const slugRegex = /^[a-z0-9][a-z0-9-]{2,30}$/

export const slugSchema = z
  .string()
  .regex(slugRegex, "Slug 3-31 karakter, küçük harf, rakam ve tire içerebilir")
  .refine(
    (slug) => !RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]),
    { message: "Bu slug kullanılamaz (sistem tarafından ayrılmış)" }
  )

/** Portföy oluşturma şeması */
export const createPortfolioSchema = z.object({
  slug: slugSchema,
  theme: z
    .string()
    .max(50, "Tema adı en fazla 50 karakter olabilir")
    .default("minimal-light"),
})

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>

/** Portföy güncelleme şeması (tüm alanlar opsiyonel) */
export const updatePortfolioSchema = z.object({
  slug: slugSchema.optional(),
  theme: z
    .string()
    .max(50, "Tema adı en fazla 50 karakter olabilir")
    .optional(),
  isPublished: z.boolean().optional(),
})

export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>
