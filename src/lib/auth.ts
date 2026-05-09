import { getIronSession } from "iron-session"
import { cookies } from "next/headers"

/**
 * Session verisi: iron-session cookie içinde şifreli olarak saklanır.
 * Sunucu tarafında session kaydı tutulmaz (stateless).
 */
export interface SessionData {
  userId: string
  email: string
}

const sessionOptions = {
  cookieName: "portfolio-session",
  password: process.env.AUTH_SECRET!,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 gün
  },
}

/**
 * Mevcut session'ı getirir.
 * Next.js 16'da `cookies()` async'tir — `await` ile çağrılır.
 */
export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/**
 * Kimlik doğrulaması gerekli olan route'larda kullanılır.
 * Session yoksa veya userId tanımsızsa hata fırlatır.
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session.userId) {
    throw new Error("Unauthorized")
  }
  return { userId: session.userId, email: session.email }
}
