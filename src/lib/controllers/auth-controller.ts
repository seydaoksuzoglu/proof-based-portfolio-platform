import bcrypt from "bcryptjs"
import { eq, and, isNull, gt } from "drizzle-orm"
import { createHash, randomUUID } from "node:crypto"

import { db } from "../db"
import { user, passwordResetToken } from "../db/schema"
import { getSession } from "../auth"
import { buildPasswordResetEmail, sendEmail } from "../email"
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from "../errors"
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordConfirmInput,
} from "../validators/auth"

const BCRYPT_COST = process.env.NODE_ENV === "production" ? 12 : 10
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 saat

type PublicUser = {
  id: string
  email: string
  fullName: string | null
}

export class AuthController {
  /** Plan 1.1.1 — bcrypt cost 10 (dev) / 12 (prod). PRD §10.2 */
  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_COST)
  }

  /** Plan 1.1.2 */
  static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }

  /**
   * Plan 1.1.3 — Yeni kullanıcı kaydı.
   * Email lowercase + UNIQUE kontrolü; başarılıysa auto-login (session oluşturur).
   * PRD §8.1: ConflictError fırlatır (email kayıtlı).
   */
  static async register(data: RegisterInput): Promise<PublicUser> {
    const email = data.email.toLowerCase().trim()

    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    if (existing) {
      throw new ConflictError("This email is already registered")
    }

    const passwordHash = await this.hashPassword(data.password)

    const [created] = await db
      .insert(user)
      .values({
        email,
        passwordHash,
        fullName: data.fullName,
      })
      .returning({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      })

    // Auto-login: session oluştur
    const session = await getSession()
    session.userId = created.id
    session.email = created.email
    await session.save()

    return created
  }

  /**
   * Plan 1.1.4 — Giriş.
   * Jenerik hata: hem "email yok" hem "şifre yanlış" aynı mesaj (PRD §10.4).
   */
  static async login(data: LoginInput): Promise<{ userId: string; email: string }> {
    const email = data.email.toLowerCase().trim()

    const [found] = await db
      .select({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
      })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    if (!found) {
      throw new AuthenticationError()
    }

    const ok = await this.verifyPassword(data.password, found.passwordHash)
    if (!ok) {
      throw new AuthenticationError()
    }

    const session = await getSession()
    session.userId = found.id
    session.email = found.email
    await session.save()

    return { userId: found.id, email: found.email }
  }

  /** Plan 1.1.5 */
  static async logout(): Promise<void> {
    const session = await getSession()
    session.destroy()
  }

  /**
   * Plan 1.1.6 — Parola sıfırlama isteği.
   * Account enumeration önlemi: hesap olmasa bile dışarıya 200 döner.
   * Token: randomUUID üretilir, sha256 ile hash'lenir, DB'ye 1 saat TTL ile yazılır.
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim()

    const [found] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.email, normalized))
      .limit(1)

    if (!found) {
      // Bilgi sızdırma — sessizce başarılı dön
      return
    }

    const rawToken = randomUUID()
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await db.insert(passwordResetToken).values({
      userId: found.id,
      tokenHash,
      expiresAt,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password/confirm?token=${rawToken}`
    const { subject, html } = buildPasswordResetEmail(resetUrl)

    try {
      await sendEmail({ to: found.email, subject, html })
    } catch (err) {
      // Email başarısız olsa bile dışarıya hata sızdırma
      console.error("[auth:reset-email-failed]", err)
    }
  }

  /**
   * Plan 1.1.7 — Token doğrula, yeni parola hash'le, token kullanılmış işaretle.
   * NOT: iron-session stateless olduğu için "tüm açık sessionları sonlandırma" tam
   * olarak mümkün değil; mevcut cihazdaki session destroy edilir. Diğer cihazlar
   * cookie TTL (7 gün) dolunca veya tarayıcı kapanınca etkisiz kalır.
   * Tam invalidation için user tablosuna sessionVersion alanı + middleware
   * kontrolü gerekir (gelecek iterasyon).
   */
  static async confirmPasswordReset(data: ResetPasswordConfirmInput): Promise<void> {
    if (data.newPassword.length < 8) {
      throw new ValidationError("Parola en az 8 karakter olmalıdır")
    }

    const tokenHash = createHash("sha256").update(data.token).digest("hex")

    const [record] = await db
      .select()
      .from(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.tokenHash, tokenHash),
          isNull(passwordResetToken.usedAt),
          gt(passwordResetToken.expiresAt, new Date()),
        ),
      )
      .limit(1)

    if (!record) {
      throw new ValidationError("Token geçersiz veya süresi dolmuş")
    }

    const newHash = await this.hashPassword(data.newPassword)

    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({ passwordHash: newHash })
        .where(eq(user.id, record.userId))

      await tx
        .update(passwordResetToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetToken.id, record.id))
    })

    // Mevcut session'ı sonlandır (diğer cihazlar için TTL ile geçersizleşir)
    const session = await getSession()
    session.destroy()
  }
}
