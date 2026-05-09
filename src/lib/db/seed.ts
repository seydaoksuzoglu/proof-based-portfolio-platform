/**
 * Seed Script — Demo veri oluşturur.
 * Kullanım: npm run db:seed
 *
 * 1 demo user (bcrypt hash'li parola)
 * 1 portfolio (slug: "demo-user", theme: "minimal-light", published)
 * 3 project (farklı görünürlükler)
 * 4 link (GitHub, LinkedIn, Twitter, website)
 */
import { config } from "dotenv"

config({ path: ".env.local" })

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { hash } from "bcryptjs"
import * as schema from "./schema"

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  console.log("🌱 Seed başlıyor...")

  // ─── 1. Demo User ──────────────────────────────────────────────
  const passwordHash = await hash("demo1234", 10)

  const [demoUser] = await db
    .insert(schema.user)
    .values({
      email: "demo@example.com",
      passwordHash,
      fullName: "Demo Kullanıcı",
      bio: "Merhaba! Ben bir yazılım geliştiriciyim. Projelerimi ve çalışmalarımı burada paylaşıyorum.",
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=DK",
    })
    .returning()

  console.log(`✅ User oluşturuldu: ${demoUser.email}`)

  // ─── 2. Portfolio ──────────────────────────────────────────────
  const [demoPortfolio] = await db
    .insert(schema.portfolio)
    .values({
      userId: demoUser.id,
      slug: "demo-user",
      theme: "minimal-light",
      isPublished: true,
    })
    .returning()

  console.log(`✅ Portfolio oluşturuldu: /${demoPortfolio.slug}`)

  // ─── 3. Projects ──────────────────────────────────────────────
  const projects = await db
    .insert(schema.project)
    .values([
      {
        portfolioId: demoPortfolio.id,
        title: "E-Ticaret Platformu",
        description:
          "Next.js ve Stripe ile geliştirilmiş tam fonksiyonel bir e-ticaret platformu. Ürün yönetimi, sepet, ödeme ve sipariş takibi özellikleri içerir.",
        demoUrl: "https://demo-ecommerce.vercel.app",
        githubUrl: "https://github.com/demo/ecommerce-platform",
        imageUrl:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
        isVisible: true,
      },
      {
        portfolioId: demoPortfolio.id,
        title: "Görev Yönetim Uygulaması",
        description:
          "React ve Firebase ile oluşturulmuş gerçek zamanlı görev yönetim uygulaması. Drag-and-drop sıralama, etiketleme ve takım işbirliği özellikleri.",
        demoUrl: "https://demo-taskmanager.vercel.app",
        githubUrl: "https://github.com/demo/task-manager",
        imageUrl:
          "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80",
        isVisible: true,
      },
      {
        portfolioId: demoPortfolio.id,
        title: "Hava Durumu API",
        description:
          "Node.js ve Express ile geliştirilmiş RESTful hava durumu API. OpenWeatherMap entegrasyonu ile gerçek zamanlı veri sağlar.",
        githubUrl: "https://github.com/demo/weather-api",
        isVisible: false, // Görünmez proje — public view'da gösterilmez
      },
    ])
    .returning()

  console.log(`✅ ${projects.length} proje oluşturuldu`)

  // ─── 4. Links ─────────────────────────────────────────────────
  const links = await db
    .insert(schema.link)
    .values([
      {
        portfolioId: demoPortfolio.id,
        title: "GitHub",
        url: "https://github.com/demo",
        icon: "github",
      },
      {
        portfolioId: demoPortfolio.id,
        title: "LinkedIn",
        url: "https://linkedin.com/in/demo",
        icon: "linkedin",
      },
      {
        portfolioId: demoPortfolio.id,
        title: "Twitter",
        url: "https://twitter.com/demo",
        icon: "twitter",
      },
      {
        portfolioId: demoPortfolio.id,
        title: "Kişisel Blog",
        url: "https://demo-blog.dev",
        icon: "link",
      },
    ])
    .returning()

  console.log(`✅ ${links.length} link oluşturuldu`)

  console.log("\n🎉 Seed tamamlandı!")
  console.log(`   Email: demo@example.com`)
  console.log(`   Parola: demo1234`)
  console.log(`   Portfolio: /${demoPortfolio.slug}`)
}

seed().catch((error) => {
  console.error("❌ Seed hatası:", error)
  process.exit(1)
})
