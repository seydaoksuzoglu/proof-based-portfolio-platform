"use server"

import { 
  registerSchema, 
  loginSchema, 
  resetPasswordRequestSchema, 
  resetPasswordConfirmSchema 
} from "@/lib/validators/auth";
import { db } from "@/lib/db"; 
import { user } from "@/lib/db/schema"; 
import { getSession } from "@/lib/auth"; 
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

/**
 * 1. KULLANICI KAYIT
 */
export async function registerUser(values: any) {
  const validatedFields = registerSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Veriler geçersiz." };

  const { email, password, fullName } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [newUser] = await db.insert(user).values({ 
      fullName, 
      email, 
      passwordHash: hashedPassword 
    }).returning();

    const session = await getSession();
    session.userId = newUser.id;
    session.email = newUser.email;
    await session.save();

    return { success: "Kayıt başarılı!" };
  } catch (error) {
    return { error: "Bu e-posta adresi zaten kayıtlı." };
  }
}

/**
 * 2. KULLANICI GİRİŞ 
 */
export async function loginUser(values: any) {
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Geçersiz format!" };

  const { email, password } = validatedFields.data;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email)
  });

  if (!existingUser || !existingUser.passwordHash) {
    return { error: "Hatalı e-posta veya şifre!" };
  }

  // Şifre kontrolü
  const passwordMatch = await bcrypt.compare(password, existingUser.passwordHash);
  if (!passwordMatch) return { error: "Hatalı e-posta veya şifre!" };

  // OTURUM AÇMA 
  const session = await getSession();
  session.userId = existingUser.id;
  session.email = existingUser.email;
  await session.save();

  return { success: "Giriş yapıldı!" };
}

/**
 * 3. ÇIKIŞ YAPMA 
 */
export async function logoutUser() {
  const session = await getSession();
  session.destroy();
  return { success: "Oturum kapatıldı." };
}

/**
 * 4. ŞİFRE SIFIRLAMA 
 */
export async function resetPasswordRequest(values: any) {
  const validatedFields = resetPasswordRequestSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Geçersiz e-posta!" };
  return { success: "Bağlantı gönderildi." };
}
 
 
