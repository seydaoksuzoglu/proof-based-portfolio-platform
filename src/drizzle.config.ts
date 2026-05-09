import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

// drizzle-kit CLI, Next.js'in .env.local otomatik yüklemesini desteklemez.
// Bu yüzden açıkça .env.local dosyasını yüklüyoruz.
config({ path: ".env.local" })

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
