import { z } from "zod"

/** Kayıt formu doğrulama şeması */
export const registerSchema = z.object({
  email: z
    .string()
    .email("Geçerli bir email adresi girin")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Parola en az 8 karakter olmalıdır")
    .max(128, "Parola en fazla 128 karakter olabilir"),
  fullName: z
    .string()
    .min(1, "Ad soyad zorunludur")
    .max(100, "Ad soyad en fazla 100 karakter olabilir")
    .trim(),
})

export type RegisterInput = z.infer<typeof registerSchema>

/** Giriş formu doğrulama şeması */
export const loginSchema = z.object({
  email: z
    .string()
    .email("Geçerli bir email adresi girin")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Parola zorunludur"),
})

export type LoginInput = z.infer<typeof loginSchema>

/** Parola sıfırlama isteği */
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .email("Geçerli bir email adresi girin")
    .transform((v) => v.toLowerCase().trim()),
})

export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>

/** Parola sıfırlama onayı */
export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, "Token zorunludur"),
  newPassword: z
    .string()
    .min(8, "Parola en az 8 karakter olmalıdır")
    .max(128, "Parola en fazla 128 karakter olabilir"),
})

export type ResetPasswordConfirmInput = z.infer<
  typeof resetPasswordConfirmSchema
>
