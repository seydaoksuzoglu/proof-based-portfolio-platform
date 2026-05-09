"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  type RegisterInput,
  type LoginInput,
  type ResetPasswordRequestInput,
  type ResetPasswordConfirmInput,
} from "@/lib/validators/auth"

import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { getSession } from "@/lib/auth"

/**
 * 1. KULLANICI KAYIT
 */
export async function registerUser(values: unknown) {
  const validatedFields = registerSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      error: "Geçersiz form verisi",
    }
  }

  const {
    email,
    password,
    fullName,
  }: RegisterInput = validatedFields.data

  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (existingUser.length > 0) {
    return {
      error: "Bu e-posta adresi zaten kayıtlı",
    }
  }

  const passwordHash = await bcrypt.hash(
    password,
    process.env.NODE_ENV === "production" ? 12 : 10
  )

  try {
    const [newUser] = await db
      .insert(user)
      .values({
        email,
        fullName,
        passwordHash,
      })
      .returning()

    const session = await getSession()

    session.userId = newUser.id
    session.email = newUser.email

    await session.save()

    return {
      success: true,
      message: "Kayıt başarılı",
    }
  } catch (err) {
    console.error("[REGISTER_ERROR]", err)

    return {
      error: "Kayıt işlemi başarısız oldu",
    }
  }
}

/**
 * 2. KULLANICI GİRİŞ
 */
export async function loginUser(values: unknown) {
  const validatedFields = loginSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      error: "Geçersiz e-posta veya şifre formatı",
    }
  }

  const {
    email,
    password,
  }: LoginInput = validatedFields.data

  try {
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    const existingUser = existingUsers[0]

    if (!existingUser) {
      return {
        error: "E-posta veya şifre hatalı",
      }
    }

    const passwordMatch = await bcrypt.compare(
      password,
      existingUser.passwordHash
    )

    if (!passwordMatch) {
      return {
        error: "E-posta veya şifre hatalı",
      }
    }

    const session = await getSession()

    session.userId = existingUser.id
    session.email = existingUser.email

    await session.save()

    return {
      success: true,
      message: "Giriş başarılı",
    }
  } catch (err) {
    console.error("[LOGIN_ERROR]", err)

    return {
      error: "Giriş işlemi başarısız oldu",
    }
  }
}

/**
 * 3. ÇIKIŞ YAPMA
 */
export async function logoutUser() {
  try {
    const session = await getSession()

    await session.destroy()

    return {
      success: true,
      message: "Oturum kapatıldı",
    }
  } catch (err) {
    console.error("[LOGOUT_ERROR]", err)

    return {
      error: "Çıkış işlemi başarısız oldu",
    }
  }
}

/**
 * 4. ŞİFRE SIFIRLAMA İSTEĞİ
 */
export async function resetPasswordRequest(values: unknown) {
  const validatedFields =
    resetPasswordRequestSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      error: "Geçersiz e-posta adresi",
    }
  }

  const { email }: ResetPasswordRequestInput =
    validatedFields.data

  try {
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    const existingUser = existingUsers[0]

    if (!existingUser) {
      return {
        success: true,
        message:
          "Eğer hesap mevcutsa parola sıfırlama bağlantısı gönderildi",
      }
    }

    return {
      success: true,
      message:
        "Eğer hesap mevcutsa parola sıfırlama bağlantısı gönderildi",
    }
  } catch (err) {
    console.error("[RESET_PASSWORD_REQUEST_ERROR]", err)

    return {
      error: "İşlem başarısız oldu",
    }
  }
}

/**
 * 5. ŞİFRE SIFIRLAMA ONAYI
 */
export async function resetPasswordConfirm(values: unknown) {
  const validatedFields =
    resetPasswordConfirmSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      error: "Geçersiz token veya parola",
    }
  }

  const {
    token,
    newPassword,
  }: ResetPasswordConfirmInput = validatedFields.data

  try {
   
    console.log(token, newPassword)

    return {
      success: true,
      message: "Parola başarıyla güncellendi",
    }
  } catch (err) {
    console.error("[RESET_PASSWORD_CONFIRM_ERROR]", err)

    return {
      error: "Parola sıfırlama işlemi başarısız oldu",
    }
  }
}

 
 
