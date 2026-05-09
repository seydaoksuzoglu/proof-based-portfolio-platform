import { z } from "zod"

/** Bağlantı oluşturma/güncelleme şeması */
export const linkSchema = z.object({
  title: z
    .string()
    .min(1, "Bağlantı başlığı zorunludur")
    .max(50, "Bağlantı başlığı en fazla 50 karakter olabilir")
    .trim(),
  url: z
    .string()
    .url("Geçerli bir URL girin")
    .startsWith("https://", "URL https:// ile başlamalıdır"),
  icon: z
    .string()
    .max(50, "İkon adı en fazla 50 karakter olabilir")
    .optional()
    .or(z.literal("")),
})

export type LinkInput = z.infer<typeof linkSchema>
