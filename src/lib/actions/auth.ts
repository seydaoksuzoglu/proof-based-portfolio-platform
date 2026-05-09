import { registerSchema, loginSchema } from "@/lib/validators/auth";
import { db } from "@/db"; 
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";

/*
 * 1. KULLANICI KAYIT FONKSİYONU (Register)
 */
export async function registerUser(values: any) {
  const validatedFields = registerSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return { error: "Veriler dökümandaki kurallara uymuyor!" };
  }

  const { email, password, name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({ name, email, password: hashedPassword });
    return { success: "Kullanıcı başarıyla oluşturuldu." };
  } catch (error) {
    return { error: "Bu e-posta adresi zaten kayıtlı!" };
  }
}

/*
 * 2. KULLANICI GİRİŞ FONKSİYONU (Login)
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
      rememberMe: true, 
    });
    return { success: "Giriş başarılı!" };
  } catch (error) {
    return { error: "E-posta veya şifre hatalı!" };
  }
}
 
