import { z } from "zod"

/** URL alanı: opsiyonel, ama girilirse https:// ile başlamalı */
const optionalHttpsUrl = z
  .string()
  .url("Geçerli bir URL girin")
  .startsWith("https://", "URL https:// ile başlamalıdır")
  .optional()
  .or(z.literal(""))

/** Proje oluşturma/güncelleme şeması */
export const projectSchema = z.object({
  title: z
    .string()
    .min(1, "Proje başlığı zorunludur")
    .max(100, "Proje başlığı en fazla 100 karakter olabilir")
    .trim(),
  description: z
    .string()
    .max(1000, "Açıklama en fazla 1000 karakter olabilir")
    .optional()
    .or(z.literal("")),
  imageUrl: optionalHttpsUrl,
  demoUrl: optionalHttpsUrl,
  githubUrl: optionalHttpsUrl,
})

export type ProjectInput = z.infer<typeof projectSchema>
