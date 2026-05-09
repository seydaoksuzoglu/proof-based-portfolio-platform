import { registerSchema } from "@/lib/validators/auth"; 
import { db } from "@/db"; 
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function registerUser(values: any) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Veriler dökümandaki kurallara uymuyor!" };
  }

  const { email, password, name } = validatedFields.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });
    return { success: "Kullanıcı başarıyla oluşturuldu." };
  } catch (error) {
    return { error: "Bu e-posta adresi zaten kayıtlı!" };
  }
}
 
