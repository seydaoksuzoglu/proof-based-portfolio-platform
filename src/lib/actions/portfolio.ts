"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { portfolios } from "@/db/schema"
import { createPortfolioSchema } from "@/lib/validators/portfolio"
import { revalidatePath } from "next/cache"

/**
 * Kullanıcı için yeni bir portfolyo kaydı oluşturur.
 * İşlem öncesinde oturum kontrolü ve veri doğrulaması yapar.
 */
export async function createPortfolio(formData: FormData) {
  // 1. Yetkilendirme Kontrolü: İstek yapan kullanıcının geçerli bir oturumu var mı?
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır. Lütfen giriş yapın." }
  }

  // 2. Veri Hazırlığı: Form verilerini yapılandırılmış bir nesneye dönüştür
  const rawData = {
    slug: formData.get("slug"),
    theme: formData.get("theme") || "minimal-light",
  }

  // 3. Şema Doğrulaması: Verilerin tanımlanmış iş kurallarına (Zod Schema) uygunluğunu denetle
  const validatedData = createPortfolioSchema.safeParse(rawData)

  if (!validatedData.success) {
    return { 
      error: "Girilen bilgiler geçersiz. Lütfen formatı kontrol edip tekrar deneyin." 
    }
  }

  try {
    // 4. Veritabanı İşlemi: Doğrulanmış veriyi portfolyo tablosuna güvenli şekilde aktar
    await db.insert(portfolios).values({
      userId: session.user.id,
      slug: validatedData.data.slug,
      theme: validatedData.data.theme,
    })

    // 5. Önbellek Güncelleme: Dashboard sayfasındaki verilerin güncel haliyle yeniden yüklenmesini sağla
    revalidatePath("/dashboard")
    return { success: "Portfolyo başarıyla oluşturuldu." }

  } catch (error) {
    // Veritabanı seviyesindeki hataları (Örn: Benzersiz slug çakışması) yakalar
    return { error: "Bu adres zaten kullanımda. Lütfen farklı bir isim seçin." }
  }
}

