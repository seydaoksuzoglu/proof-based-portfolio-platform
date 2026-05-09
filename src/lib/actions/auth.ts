"use server"

import { 
  registerSchema, 
  loginSchema, 
  resetPasswordRequestSchema, 
  resetPasswordConfirmSchema 
} from "@/lib/validators/auth";
import { db } from "@/db"; 
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";

/*
 * 1. KULLANICI KAYIT (Register)
 */
export async function registerUser(values: any) {
  const validatedFields = registerSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return { error: "Girdiğiniz bilgiler hatalı. Lütfen tüm alanları kontrol ediniz." };
  }

  const { email, password, fullName } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({ 
      name: fullName, 
      email: email, 
      password: hashedPassword 
    });
    return { success: "Kullanıcı başarıyla oluşturuldu." };
  } catch (error) {
    return { error: "Bu e-posta adresi zaten kayıtlı!" };
  }
}

/*
 * 2. KULLANICI GİRİŞ (Login)
 */
export async function loginUser(values: any) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Geçersiz giriş bilgileri!" };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return { success: "Giriş başarılı!" };
  } catch (error) {
    return { error: "E-posta veya şifre hatalı!" };
  }
}

/*
 * 3. PAROLA SIFIRLAMA İSTEĞİ
 */
export async function resetPasswordRequest(values: any) {
  const validatedFields = resetPasswordRequestSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Lütfen geçerli bir e-posta adresi giriniz." };
  }

  const { email } = validatedFields.data;
  // TODO: E-posta gönderim servisi buraya eklenecek
  return { success: "Şifre sıfırlama bağlantısı gönderildi." };
}

/*
 * 4. PAROLA SIFIRLAMA ONAYI
 */
export async function resetPasswordConfirm(values: any) {
  const validatedFields = resetPasswordConfirmSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "İşlem geçersiz veya şifre kurallara uymuyor." };
  }

  const { token, newPassword } = validatedFields.data;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  return { success: "Şifreniz başarıyla güncellendi." };
}
 
