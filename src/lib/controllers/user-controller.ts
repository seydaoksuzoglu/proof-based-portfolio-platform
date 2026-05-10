import { eq } from "drizzle-orm"

import { db } from "../db"
import { user } from "../db/schema"
import { NotFoundError } from "../errors"
import type { UpdateProfileInput } from "../validators/user"

type PublicProfile = {
  id: string
  email: string
  fullName: string | null
  bio: string | null
  avatarUrl: string | null
}

export class UserController {
  /**
   * Plan 2.3 destek (2026-05-10) — Dashboard için profil okuma.
   * passwordHash ve createdAt asla dönmez (PRD §10.4 — bilgi sızıntısı önlemi).
   * Kullanıcı bulunamazsa NotFoundError (session geçerli ama user silinmiş edge-case).
   */
  static async getProfile(userId: string): Promise<PublicProfile> {
    const [found] = await db
      .select({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!found) throw new NotFoundError("User not found")
    return found
  }

  /**
   * Plan 2.4 — Kullanıcı profili güncelleme.
   * PATCH semantiği: undefined alanlara dokunulmaz; boş string → null
   * (kullanıcının bio/avatar'ı temizlemesine izin verir).
   * PRD §7.3: bio max 500, fullName max 100, avatarUrl URL formatı.
   * passwordHash ve email asla dönmez (PRD §10.4 — bilgi sızıntısı önlemi).
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileInput,
  ): Promise<PublicProfile> {
    const patch: Partial<typeof user.$inferInsert> = {}

    if (data.fullName !== undefined) patch.fullName = data.fullName
    if (data.bio !== undefined) patch.bio = data.bio === "" ? null : data.bio
    if (data.avatarUrl !== undefined) {
      patch.avatarUrl = data.avatarUrl === "" ? null : data.avatarUrl
    }

    const [updated] = await db
      .update(user)
      .set(patch)
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      })

    if (!updated) throw new NotFoundError("User not found")
    return updated
  }
}
