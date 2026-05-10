import { z } from "zod"

/**
 * Plan 2.4 / PRD §7.3 — Profil güncelleme.
 * Tüm alanlar opsiyonel; sadece gönderilenler güncellenir (PATCH semantiği).
 * Email değişikliği MVP kapsamı dışında (Plan §2.4).
 */
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Ad soyad boş olamaz")
      .max(100, "Ad soyad en fazla 100 karakter olabilir")
      .trim()
      .optional(),
    bio: z
      .string()
      .max(500, "Bio en fazla 500 karakter olabilir")
      .optional(),
    avatarUrl: z
      .union([z.string().url("Geçerli bir URL girin"), z.literal("")])
      .optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.bio !== undefined ||
      data.avatarUrl !== undefined,
    { message: "En az bir alan güncellenmeli" },
  )

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
