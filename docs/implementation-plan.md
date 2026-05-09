# Proof-Based Portfolio Platform — Detaylı Implementasyon Planı

> **Versiyon:** 1.0  
> **Tarih:** 2026-05-08  
> **Dayanak:** Yaşayan Proje Dokümanı v1.0.0

Bu plan, yaşayan dokümandaki mimari kararları ve sprint kapsamını **kod seviyesinde eyleme dönüştüren** yol haritasıdır. Her madde; dosya yolu, fonksiyon imzası, bağımlılık ve kabul kriterini içerir.

---

## 0. Git ve Branch Stratejisi

```bash
# Branch isimlendirme
main                    # Korumalı, doğrudan push yasak
  └── feature/sprint-0-setup
  └── feature/sprint-1-auth-register
  └── feature/sprint-1-auth-login
  └── feature/sprint-2-portfolio-crud
  └── feature/sprint-3-project-link-management
  └── feature/sprint-4-public-view
  └── feature/sprint-5-polish

# PR Kuralı: Bir PR = bir use case veya bir endpoint grubu. Max 400 satır.
# Commit: Conventional Commits
#   feat(auth): add iron-session configuration
#   fix(slug): validate reserved keywords correctly
#   test(portfolio): add slug collision integration test
```

---

## Sprint 0 — Altyapı ve İskelet (3–4 gün)

### 0.1. Repo ve CI/CD Kurulumu

| #     | Görev                 | Dosya / Komut                      | Kabul Kriteri                                                 |
| ----- | --------------------- | ---------------------------------- | ------------------------------------------------------------- |
| 0.1.1 | GitHub repo oluşturma | `github.com/new`                   | Branch protection aktif (main: PR + 1 approval + CI yeşil)    |
| 0.1.2 | PR şablonu            | `.github/pull_request_template.md` | Checklist: test, lint, tip kontrolü                           |
| 0.1.3 | CI pipeline           | `.github/workflows/ci.yml`         | `pnpm lint`, `pnpm type-check`, `pnpm test` her PR'da çalışır |

### 0.2. Next.js 16 + Tailwind v4 + shadcn/ui İskeleti

| #     | Görev                      | Dosya / Komut                                                                            | Kabul Kriteri                                                       |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 0.2.1 | Proje oluşturma            | `npx create-next-app@latest portfolio-app --typescript --tailwind --app --src-dir=false` | `npm run dev` çalışır, boş sayfa `localhost:3000`'de görünür        |
| 0.2.2 | Tailwind v4 yapılandırması | `app/globals.css`                                                                        | `@import "tailwindcss";` + `@theme` bloğu (light/dark değişkenleri) |
| 0.2.3 | shadcn/ui init             | `npx shadcn@latest init`                                                                 | `components.json` oluşturulur                                       |
| 0.2.4 | Temel bileşenler           | `npx shadcn add button input card dialog toast form label switch alert-dialog`           | Her bileşen `components/ui/` altında import edilebilir              |

### 0.3. Drizzle ORM + Neon PostgreSQL

| #     | Görev                 | Dosya                                          | Kabul Kriteri                                                            |
| ----- | --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| 0.3.1 | Bağımlılıklar         | `package.json`                                 | `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `dotenv` yüklü |
| 0.3.2 | Çevre değişkenleri    | `.env.local`, `.env.example`                   | `DATABASE_URL`, `AUTH_SECRET` (min 32 karakter)                          |
| 0.3.3 | Drizzle config        | `drizzle.config.ts`                            | `schema: "./lib/db/schema.ts"`, `out: "./drizzle"`                       |
| 0.3.4 | **Veritabanı Şeması** | `lib/db/schema.ts`                             | 4 tablo (user, portfolio, project, link) + cascade ilişkiler tanımlı     |
| 0.3.5 | Singleton db instance | `lib/db/index.ts`                              | `globalThis` üzerinde singleton; hot-reload koruması var                 |
| 0.3.6 | İlk migration         | `drizzle-kit generate` + `drizzle-kit migrate` | Neon'da tablolar oluşturulur, `drizzle/` altında migration dosyası var   |

```typescript
// lib/db/index.ts — Singleton örneği
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 0.4. iron-session Kurulumu

| #     | Görev              | Dosya          | Kabul Kriteri                                              |
| ----- | ------------------ | -------------- | ---------------------------------------------------------- |
| 0.4.1 | Bağımlılık         | `package.json` | `iron-session` yüklü                                       |
| 0.4.2 | Session tipi       | `lib/auth.ts`  | `SessionData` arayüzü tanımlı (userId, email)              |
| 0.4.3 | getSession helper  | `lib/auth.ts`  | `async function getSession()` — `await cookies()` kullanır |
| 0.4.4 | requireAuth helper | `lib/auth.ts`  | Session yoksa `UnauthorizedError` fırlatır                 |

```typescript
// lib/auth.ts — iron-session yapılandırması
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  email: string;
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    cookieName: "portfolio-session",
    password: process.env.AUTH_SECRET!,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 gün
    },
  });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return session;
}
```

### 0.5. Zod Validatör İskeleti

| #     | Görev                | Dosya                              | Kabul Kriteri                                                      |
| ----- | -------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| 0.5.1 | Auth şemaları        | `lib/validators/auth.ts`           | `registerSchema`, `loginSchema` tanımlı                            |
| 0.5.2 | Portfolio şeması     | `lib/validators/portfolio.ts`      | `createPortfolioSchema` (slug regex + max 30)                      |
| 0.5.3 | Project şeması       | `lib/validators/project.ts`        | `projectSchema` (title max 100, desc max 1000, url'ler `https://`) |
| 0.5.4 | Link şeması          | `lib/validators/link.ts`           | `linkSchema` (title max 50, url `.url()`)                          |
| 0.5.5 | Rezerve slug listesi | `lib/validators/reserved-slugs.ts` | 16 rezerve kelime `as const` array                                 |

### 0.6. Hata Sınıfları ve Global Hata Yönetimi

| #     | Görev                  | Dosya               | Kabul Kriteri                                                             |
| ----- | ---------------------- | ------------------- | ------------------------------------------------------------------------- |
| 0.6.1 | Custom error sınıfları | `lib/errors.ts`     | `ValidationError`, `NotFoundError`, `AuthorizationError`, `ConflictError` |
| 0.6.2 | Global error boundary  | `app/error.tsx`     | Beklenmeyen hataları yakalar, kullanıcıya jenerik mesaj gösterir          |
| 0.6.3 | 404 sayfası            | `app/not-found.tsx` | `notFound()` çağrıldığında render olur                                    |

### 0.7. Seed ve Test Altyapısı

| #     | Görev           | Dosya                      | Kabul Kriteri                                                          |
| ----- | --------------- | -------------------------- | ---------------------------------------------------------------------- |
| 0.7.1 | Seed script     | `lib/db/seed.ts`           | 1 demo user (bcrypt hash'li), 1 portfolio, 3 project, 4 link oluşturur |
| 0.7.2 | Vitest kurulumu | `vitest.config.ts`         | `test/` dizini tanımlı, path alias `@/*` çalışır                       |
| 0.7.3 | Dummy test      | `tests/unit/dummy.test.ts` | `expect(true).toBe(true)` geçer, CI'da çalışır                         |

### 0.8. Vercel Deploy

| #     | Görev                    | Kabul Kriteri                                                   |
| ----- | ------------------------ | --------------------------------------------------------------- |
| 0.8.1 | Vercel projesi oluşturma | `main` branch otomatik deploy edilir                            |
| 0.8.2 | Ortam değişkenleri       | Neon `DATABASE_URL` ve `AUTH_SECRET` Vercel dashboard'a girilir |
| 0.8.3 | Preview deploy           | Her PR için preview URL oluşturulur                             |

**Sprint 0 Bitiş Kriteri:**  
`npm run dev` çalışır, boş sayfa Vercel'de yayında, CI yeşil, seed çalışıyor, `lib/db/schema.ts` Neon'da migration edilmiş, `getSession()` test edilmiş.

---

## Sprint 1 — Kimlik Doğrulama (1 hafta)

> **Bağımlılık:** Sprint 0 tamamlanmış olmalı.  
> **Kapsam:** UC-1, UC-2/6, UC-11

### 1.1. AuthController Implementasyonu

| #     | Görev                  | Dosya                                | İmza / Detay                                                                                                                                                           |
| ----- | ---------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 | `hashPassword`         | `lib/controllers/auth-controller.ts` | `static async hashPassword(plain: string): Promise<string>` — bcrypt cost 10                                                                                           |
| 1.1.2 | `verifyPassword`       | Aynı dosya                           | `static async verifyPassword(plain: string, hash: string): Promise<boolean>`                                                                                           |
| 1.1.3 | `register`             | Aynı dosya                           | `static async register(data: RegisterInput): Promise<User>` — email lowercase, UNIQUE kontrolü, auto-login (session oluşturur)                                         |
| 1.1.4 | `login`                | Aynı dosya                           | `static async login(data: LoginInput): Promise<SessionData>` — jenerik hata: `"Email or password incorrect"`                                                           |
| 1.1.5 | `logout`               | Aynı dosya                           | `static async logout(): Promise<void>` — session.destroy()                                                                                                             |
| 1.1.6 | `requestPasswordReset` | Aynı dosya                           | `static async requestPasswordReset(email: string): Promise<void>` — cuid token üret, hash'le, DB'ye kaydet (1 saat TTL), Resend ile email. Hesap yoksa bile 200 döner. |
| 1.1.7 | `confirmPasswordReset` | Aynı dosya                           | `static async confirmPasswordReset(data: ResetInput): Promise<void>` — token hash karşılaştır, yeni parola hash'le, token sil, tüm sessionları sonlandır               |

### 1.2. Reset Token Yönetimi

| #     | Görev        | Dosya                                | Detay                                                                    |
| ----- | ------------ | ------------------------------------ | ------------------------------------------------------------------------ |
| 1.2.1 | Token şeması | `lib/db/schema.ts` (ek alan)         | `passwordResetToken` tablosu: `id, userId, tokenHash, expiresAt, usedAt` |
| 1.2.2 | Token üretim | `lib/controllers/auth-controller.ts` | `crypto.randomUUID()` veya `cuid` kullan; DB'ye hash'li kaydet           |

### 1.3. API Route Handler'ları

| #     | Endpoint                                | Dosya                                          | Detay                                                                    |
| ----- | --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| 1.3.1 | `POST /api/auth/register`               | `app/api/auth/register/route.ts`               | Body → Zod validate → `AuthController.register()` → 201 + session cookie |
| 1.3.2 | `POST /api/auth/login`                  | `app/api/auth/login/route.ts`                  | Body → Zod validate → `AuthController.login()` → 200 + session cookie    |
| 1.3.3 | `POST /api/auth/logout`                 | `app/api/auth/logout/route.ts`                 | `requireAuth()` → `AuthController.logout()` → 200 + cookie temizleme     |
| 1.3.4 | `POST /api/auth/reset-password/request` | `app/api/auth/reset-password/request/route.ts` | Body (email) → her durumda 200 döner (enumeration önlemi)                |
| 1.3.5 | `POST /api/auth/reset-password/confirm` | `app/api/auth/reset-password/confirm/route.ts` | Body (token, newPassword) → validate → update → 200                      |

### 1.4. Middleware (Route Protection)

| #     | Görev           | Dosya           | Detay                                                                                                                                                                         |
| ----- | --------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.1 | `middleware.ts` | `middleware.ts` | `portfolio-session` cookie oku; `(dashboard)/*` ve `/api/portfolio`, `/api/projects`, `/api/links` için auth kontrolü. Auth yoksa: sayfa ise `/login`'e redirect, API ise 401 |

```typescript
// middleware.ts — örnek yapı
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("portfolio-session");
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/api/portfolio") ||
    request.nextUrl.pathname.startsWith("/api/projects") ||
    request.nextUrl.pathname.startsWith("/api/links");

  if (isProtected && !session) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

> **Not (1.4 uygulaması — 2026-05-09):** Plan'ın yukarıdaki örnek kodu sadece cookie varlık kontrolü yapıyor; ancak PRD §10.5 Erişim Kontrol Matrisi'nde `/api/portfolio/check-slug` ve `/api/portfolio/public/[slug]` rotaları public olarak işaretli. Bu çelişkiyi gidermek için middleware'e public API path whitelist'i (`PUBLIC_API_PATHS`) eklendi; ayrıca performans için `config.matcher` ile path daraltması yapıldı. Edge runtime'da iron-session decrypt etmek pahalı olduğundan cookie içeriği middleware'de açılmaz; gerçek doğrulama controller seviyesinde `requireAuth()` ile yapılır.

### 1.5. Frontend — Auth Sayfaları

| #     | Bileşen          | Dosya                                                                | Detay                                                                                                                |
| ----- | ---------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1.5.1 | RegisterForm     | `app/(auth)/register/page.tsx` + `components/auth/register-form.tsx` | RHF + Zod (`registerSchema`), submit → `fetch('/api/auth/register')`, hata → toast, başarı → `/dashboard`'a redirect |
| 1.5.2 | LoginForm        | `app/(auth)/login/page.tsx` + `components/auth/login-form.tsx`       | RHF + Zod (`loginSchema`), jenerik hata mesajı gösterimi                                                             |
| 1.5.3 | ResetRequestForm | `app/(auth)/reset-password/page.tsx`                                 | Email input; sonuç her zaman: `"Eğer hesap varsa link gönderildi"`                                                   |
| 1.5.4 | ResetConfirmForm | `app/(auth)/reset-password/confirm/page.tsx`                         | `?token=...` query'den oku; yeni parola + onay parolası; token geçersizse hata                                       |

### 1.6. Testler

| #     | Test        | Dosya                                | Kapsam                                                                                                                                   |
| ----- | ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1.6.1 | Birim       | `tests/unit/auth-controller.test.ts` | `hashPassword` round-trip, `verifyPassword` yanlış parola, `register` çakışma, `login` jenerik hata                                      |
| 1.6.2 | Integration | `tests/integration/auth.test.ts`     | `/api/auth/register` (başarı + duplicate email), `/api/auth/login` (başarı + yanlış), `/api/auth/logout`, reset flow (request + confirm) |

**Sprint 1 Bitiş Kriteri:**  
Kayıt, giriş, çıkış, parola sıfırlama çalışır. Middleware dashboard'u korur. Account enumeration testi geçer. Reset token tek kullanımlık.

---

## Sprint 2 — Portföy Çekirdeği (4–5 gün)

> **Bağımlılık:** Sprint 1 (auth session çalışıyor olmalı).  
> **Kapsam:** UC-4, UC-7, UC-9, UC-5

### 2.1. PortfolioController

| #     | Metot                   | İmza                                                                                                          | Detay                                                                                                |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 2.1.1 | `createPortfolio`       | `static async createPortfolio(userId: string, data: PortfolioInput): Promise<Portfolio>`                      | Slug regex kontrolü, rezerve liste kontrolü, DB UNIQUE kontrolü, 1 kullanıcı = 1 portföy (varsa 409) |
| 2.1.2 | `getPublicPortfolio`    | `static async getPublicPortfolio(slug: string): Promise<PublicPortfolio>`                                     | Sadece `isPublished=true`; ilişkili `isVisible=true` Project ve Link'leri include et                 |
| 2.1.3 | `updatePortfolio`       | `static async updatePortfolio(id: string, userId: string, data: Partial<PortfolioInput>): Promise<Portfolio>` | Sahiplik kontrolü; slug değişiyorsa yeni çakışma kontrolü                                            |
| 2.1.4 | `publishPortfolio`      | `static async publishPortfolio(id: string, userId: string, status: boolean): Promise<Portfolio>`              | `isPublished` toggle; `status=true` ise `revalidatePath('/' + slug)` çağrısı                         |
| 2.1.5 | `checkSlugAvailability` | `static async checkSlugAvailability(slug: string): Promise<boolean>`                                          | Format + rezerve + DB UNIQUE kontrolü                                                                |

### 2.2. API Route Handler'ları

| #     | Endpoint                           | Dosya                                      | Detay                                                                                         |
| ----- | ---------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 2.2.1 | `POST /api/portfolio`              | `app/api/portfolio/route.ts`               | `requireAuth()` → Zod validate → `PortfolioController.createPortfolio()` → 201                |
| 2.2.2 | `PATCH /api/portfolio/[id]`        | `app/api/portfolio/[id]/route.ts`          | `requireAuth()` → sahiplik kontrolü → Zod validate → update → 200                             |
| 2.2.3 | `GET /api/portfolio/check-slug`    | `app/api/portfolio/check-slug/route.ts`    | Query param `slug` → `PortfolioController.checkSlugAvailability()` → `{ available: boolean }` |
| 2.2.4 | `GET /api/portfolio/public/[slug]` | `app/api/portfolio/public/[slug]/route.ts` | Slug → `getPublicPortfolio()` → 200 veya 404                                                  |

### 2.3. Frontend — Dashboard ve Onboarding

| #     | Bileşen          | Dosya                                       | Detay                                                                                                                        |
| ----- | ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 2.3.1 | Onboarding modal | `components/dashboard/onboarding-modal.tsx` | İlk girişte gösterilir; slug input + canlı debounced doğrulama (`/api/portfolio/check-slug?slug=...`) + tema seçimi (2 kart) |
| 2.3.2 | ProfileEditor    | `components/dashboard/profile-editor.tsx`   | `PATCH /api/user/profile`; bio textarea (karakter sayacı 500), avatarUrl input, fullName input; optimistic UI                |
| 2.3.3 | ThemeSelector    | `components/dashboard/theme-selector.tsx`   | Light/dark kartları; seçim → `PATCH /api/portfolio/[id]`                                                                     |
| 2.3.4 | PublishToggle    | `components/dashboard/publish-toggle.tsx`   | `Switch` bileşeni; toggle → `PATCH /api/portfolio/[id]`; başarılı olursa paylaşılabilir URL göster + copy-to-clipboard       |
| 2.3.5 | Dashboard layout | `app/(dashboard)/layout.tsx`                | Sidebar veya üst menü; session bilgisine göre render                                                                         |

### 2.4. Kullanıcı Profili API'si

| #     | Endpoint                  | Dosya                           | Detay                                                                                     |
| ----- | ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| 2.4.1 | `PATCH /api/user/profile` | `app/api/user/profile/route.ts` | `requireAuth()` → `bio`, `avatarUrl`, `fullName` güncelleme; email değişikliği MVP'de yok |

### 2.5. Testler

| #     | Test        | Dosya                                     | Kapsam                                                                                                     |
| ----- | ----------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 2.5.1 | Birim       | `tests/unit/portfolio-controller.test.ts` | Slug validasyon (regex, rezerve), çakışma, sahiplik kontrolü                                               |
| 2.5.2 | Integration | `tests/integration/portfolio.test.ts`     | Create (başarı + duplicate slug + rezerve slug), update (yetkisiz 403), public fetch (yayında değilse 404) |

**Sprint 2 Bitiş Kriteri:**  
Yeni kullanıcı onboarding ile slug seçip portföy oluşturabiliyor. Aynı slug iki kez alınamıyor (race'te DB UNIQUE reddeder). Rezerve slug'lar bloklu. Tema ve yayın durumu kaydediliyor. `revalidatePath` çalışıyor.

---

## Sprint 3 — İçerik Yönetimi (1 hafta)

> **Bağımlılık:** Sprint 2 (portföy oluşturulmuş olmalı).  
> **Kapsam:** UC-3, UC-8, UC-13, UC-14, Link CRUD

### 3.1. ProjectController

| #     | Metot              | İmza                                                                                           | Detay                                                    |
| ----- | ------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 3.1.1 | `createProject`    | `static async createProject(portfolioId: string, data: ProjectInput): Promise<Project>`        | Portfolio sahipliği kontrolü; `isVisible` default `true` |
| 3.1.2 | `updateProject`    | `static async updateProject(id: string, userId: string, data: ProjectInput): Promise<Project>` | Proje varlığı + portfolio üzerinden userId eşleşmesi     |
| 3.1.3 | `deleteProject`    | `static async deleteProject(id: string, userId: string): Promise<void>`                        | Sahiplik kontrolü; kalıcı silme                          |
| 3.1.4 | `toggleVisibility` | `static async toggleVisibility(id: string, userId: string): Promise<Project>`                  | `isVisible` toggle; güncellenmiş nesne döner             |

### 3.2. LinkController

| #     | Metot        | İmza                                                                                  | Detay                                                              |
| ----- | ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 3.2.1 | `createLink` | `static async createLink(portfolioId: string, data: LinkInput): Promise<Link>`        | URL `https://` zorunlu; `icon` boşsa `getIconForUrl(url)` çağrılır |
| 3.2.2 | `updateLink` | `static async updateLink(id: string, userId: string, data: LinkInput): Promise<Link>` | Sahiplik kontrolü                                                  |
| 3.2.3 | `deleteLink` | `static async deleteLink(id: string, userId: string): Promise<void>`                  | Sahiplik kontrolü                                                  |

### 3.3. Yardımcı Fonksiyonlar

| #     | Fonksiyon       | Dosya                     | Detay                                                               |
| ----- | --------------- | ------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 3.3.1 | `getIconForUrl` | `lib/get-icon-for-url.ts` | Host bazlı ikon eşleştirme: `linkedin.com → linkedin`, `twitter.com | x.com → twitter`, `github.com → github`, `instagram.com → instagram`, default → `link` |

### 3.4. API Route Handler'ları

| #     | Endpoint                              | Dosya                                       | Detay                                                             |
| ----- | ------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| 3.4.1 | `POST /api/projects`                  | `app/api/projects/route.ts`                 | `requireAuth()` → Zod → `ProjectController.createProject()` → 201 |
| 3.4.2 | `GET /api/projects`                   | `app/api/projects/route.ts`                 | `requireAuth()` → kullanıcının tüm projeleri (`createdAt DESC`)   |
| 3.4.3 | `PATCH /api/projects/[id]`            | `app/api/projects/[id]/route.ts`            | `requireAuth()` → sahiplik → Zod → update → 200                   |
| 3.4.4 | `DELETE /api/projects/[id]`           | `app/api/projects/[id]/route.ts`            | `requireAuth()` → sahiplik → delete → 204                         |
| 3.4.5 | `PATCH /api/projects/[id]/visibility` | `app/api/projects/[id]/visibility/route.ts` | `requireAuth()` → sahiplik → toggle → 200                         |
| 3.4.6 | `POST /api/links`                     | `app/api/links/route.ts`                    | `requireAuth()` → Zod → `LinkController.createLink()` → 201       |
| 3.4.7 | `GET /api/links`                      | `app/api/links/route.ts`                    | `requireAuth()` → kullanıcının tüm linkleri                       |
| 3.4.8 | `PATCH /api/links/[id]`               | `app/api/links/[id]/route.ts`               | `requireAuth()` → sahiplik → Zod → update → 200                   |
| 3.4.9 | `DELETE /api/links/[id]`              | `app/api/links/[id]/route.ts`               | `requireAuth()` → sahiplik → delete → 204                         |

### 3.5. Frontend — Dashboard İçerik Yönetimi

| #     | Bileşen      | Dosya                                    | Detay                                                                                                                                                        |
| ----- | ------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3.5.1 | ProjectModal | `components/dashboard/project-modal.tsx` | shadcn `Dialog`; create/edit birleşik (`initialValues` prop); alanlar: title, description (textarea), demoUrl, githubUrl, imageUrl; submit → POST veya PATCH |
| 3.5.2 | LinkModal    | `components/dashboard/link-modal.tsx`    | Dialog; title, url input; icon otomatik dolar; submit → POST veya PATCH                                                                                      |
| 3.5.3 | ProjectList  | `components/dashboard/project-list.tsx`  | Grid/list; her item'da: edit butonu, visibility toggle (Switch), delete butonu (AlertDialog onaylı); `createdAt DESC`                                        |
| 3.5.4 | LinkList     | `components/dashboard/link-list.tsx`     | Benzer yapı; icon görseli gösterilir                                                                                                                         |
| 3.5.5 | EmptyState   | `components/dashboard/empty-state.tsx`   | `"No projects yet. Add your first one →"`                                                                                                                    |

### 3.6. Optimistic UI Pattern'i

```typescript
// Dashboard bileşenlerinde kullanılacak pattern
const [projects, setProjects] = useState(initialProjects);

async function handleToggleVisibility(projectId: string) {
  // 1. Optimistic update
  const previous = projects;
  setProjects(
    projects.map((p) =>
      p.id === projectId ? { ...p, isVisible: !p.isVisible } : p,
    ),
  );

  try {
    await fetch(`/api/projects/${projectId}/visibility`, { method: "PATCH" });
  } catch {
    // 2. Hata durumunda geri al
    setProjects(previous);
    toast.error("Failed to update visibility");
  }
}
```

### 3.7. Testler

| #     | Test        | Dosya                                   | Kapsam                                               |
| ----- | ----------- | --------------------------------------- | ---------------------------------------------------- |
| 3.7.1 | Birim       | `tests/unit/project-controller.test.ts` | Create (sahiplik), update (yetkisiz), toggle, delete |
| 3.7.2 | Birim       | `tests/unit/link-controller.test.ts`    | Create (icon otomatik), update, delete               |
| 3.7.3 | Birim       | `tests/unit/get-icon-for-url.test.ts`   | Bilinen host'lar ve default                          |
| 3.7.4 | Integration | `tests/integration/projects.test.ts`    | CRUD + visibility toggle (happy + yetkisiz)          |
| 3.7.5 | Integration | `tests/integration/links.test.ts`       | CRUD (happy + yetkisiz)                              |

**Sprint 3 Bitiş Kriteri:**  
Kullanıcı proje ve link ekleyebiliyor, düzenleyebiliyor, silebiliyor, görünürlüğü değiştirebiliyor. Bilinen sosyal platformlar otomatik icon alıyor. Optimistic UI hata durumunda geri alıyor.

---

## Sprint 4 — Public View ve GitHub Entegrasyonu (1 hafta)

> **Bağımlılık:** Sprint 2 (portföy) ve Sprint 3 (içerik).  
> **Kapsam:** UC-10, UC-15

### 4.1. Public Portfolio Sayfası (SSG/ISR)

| #     | Görev                  | Dosya                                     | Detay                                                                                                                                                                                           |
| ----- | ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1.1 | `[slug]` page          | `app/[slug]/page.tsx`                     | `async function Page({ params }: { params: Promise<{ slug: string }> })`; `const { slug } = await params`; `PortfolioController.getPublicPortfolio(slug)`; `notFound()` çağrısı yayında değilse |
| 4.1.2 | ISR config             | `app/[slug]/page.tsx`                     | `export const revalidate = 60;` veya `revalidatePath` on-demand kullanımı                                                                                                                       |
| 4.1.3 | ThemeProvider (public) | `components/portfolio/theme-provider.tsx` | `<html data-theme={portfolio.theme}>` SSR'da set; CSS değişkenleri uygula                                                                                                                       |
| 4.1.4 | ProfileCard            | `components/portfolio/profile-card.tsx`   | Avatar, fullName, bio gösterimi                                                                                                                                                                 |
| 4.1.5 | BentoGrid              | `components/portfolio/bento-grid.tsx`     | Project ve Link'leri grid layout'ta render; `isVisible=true` filtrelemesi server'da yapılmış olmalı                                                                                             |
| 4.1.6 | ProjectCard            | `components/portfolio/project-card.tsx`   | Kapak görseli, başlık, açıklama, demo/github linkleri                                                                                                                                           |
| 4.1.7 | LinkCard               | `components/portfolio/link-card.tsx`      | Icon + title + url; yeni sekmede aç                                                                                                                                                             |

### 4.2. GitHub Import

| #     | Görev              | Dosya                                    | Detay                                                                                                                                                            |
| ----- | ------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.2.1 | GitHub API client  | `lib/github.ts`                          | `fetch('https://api.github.com/users/{username}/repos', { headers: { Authorization: token } })`                                                                  |
| 4.2.2 | `importFromGitHub` | `lib/controllers/project-controller.ts`  | Repo listesini çek; `title=repo.name`, `description=repo.description`, `githubUrl=repo.html_url`; çakışma kontrolü (aynı `githubUrl` varsa update, yoksa create) |
| 4.2.3 | API endpoint       | `app/api/github/import/route.ts`         | `POST`; body `{ githubUsername: string }`; `requireAuth()` → `ProjectController.importFromGitHub()` → 200 `{ imported: number, updated: number }`                |
| 4.2.4 | GitHub Import UI   | `components/dashboard/github-import.tsx` | Input (github username) + "İçe Aktar" butonu; sonuç: kaç proje eklendi/güncellendi                                                                               |

### 4.3. 404 ve Hata Sayfaları

| #     | Görev      | Dosya                      | Detay                                         |
| ----- | ---------- | -------------------------- | --------------------------------------------- |
| 4.3.1 | Public 404 | `app/[slug]/not-found.tsx` | "Portfolio not found or not published" mesajı |
| 4.3.2 | Genel 404  | `app/not-found.tsx`        | Minimal tasarım                               |

### 4.4. Testler

| #     | Test        | Dosya                                        | Kapsam                                                                             |
| ----- | ----------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| 4.4.1 | Integration | `tests/integration/public-portfolio.test.ts` | Public fetch (başarı + yayında değilse 404 + isVisible=false projeler görünmemeli) |
| 4.4.2 | Integration | `tests/integration/github-import.test.ts`    | Import (mock fetch), çakışma çözümü (update vs create)                             |
| 4.4.3 | Birim       | `tests/unit/github.test.ts`                  | Repo verisi parse, null description handle                                         |

**Sprint 4 Bitiş Kriteri:**  
`app.com/[slug]` görüntülenebiliyor. GitHub'dan repo'lar içe aktarılabiliyor. Yayında olmayan portföyler 404. `isVisible=false` projeler public view'da görünmüyor. Tema doğru uygulanıyor.

---

## Sprint 5 — Polish, Güvenlik ve Hesap Silme (3–4 gün)

> **Bağımlılık:** Sprint 1–4 tamamlanmış olmalı.  
> **Kapsam:** UC-12, güvenlik doğrulama, performans

### 5.1. Hesap Silme (UC-12)

| #     | Görev                 | Dosya                               | Detay                                                                                                                                                          |
| ----- | --------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1.1 | `DELETE /api/account` | `app/api/account/route.ts`          | `requireAuth()` → parola tekrar iste (body'de `password`) → `verifyPassword` → `db.delete(user).where(...)` (cascade tüm veriyi siler) → session temizle → 204 |
| 5.1.2 | Hesap silme UI        | `app/(dashboard)/settings/page.tsx` | AlertDialog; "Bu işlem geri alınamaz"; parola input'u                                                                                                          |

### 5.2. Güvenlik ve Hata Doğrulama

| #     | Görev                   | Dosya                     | Detay                                                                                                       |
| ----- | ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 5.2.1 | XSS kontrolü            | Manuel test               | `bio`, `description`, `title` alanlarına `<script>alert(1)</script>` gir; React escape ediyor mu kontrol et |
| 5.2.2 | CSRF kontrolü           | `middleware.ts` review    | SameSite=Lax + POST/PATCH/DELETE origin kontrolü                                                            |
| 5.2.3 | Input validation review | Tüm `lib/validators/*.ts` | Zod şemaları tüm API route'larında kullanılıyor mu kontrol et                                               |
| 5.2.4 | Hata mesajı audit       | Tüm controller'lar        | Teknik detay sızmıyor mu? (örn. DB hata kodları kullanıcıya gitmemeli)                                      |

### 5.3. Performans ve UX Polish

| #     | Görev            | Dosya                        | Detay                                                     |
| ----- | ---------------- | ---------------------------- | --------------------------------------------------------- |
| 5.3.1 | Loading skeleton | `components/ui/skeleton.tsx` | Dashboard ve public view için loading state'ler           |
| 5.3.2 | Lighthouse       | Chrome DevTools              | Performans skoru 85+ hedefi; kritik yavaşlık varsa düzelt |
| 5.3.3 | Responsive test  | Gerçek cihaz veya DevTools   | iPhone SE, iPad, Desktop breakpoint'leri                  |
| 5.3.4 | Tarayıcı test    | Chrome + Safari              | Temel akışlar manuel test edilir                          |
| 5.3.5 | Favicon ve meta  | `app/layout.tsx`             | Favicon, title, description; statik OG image              |

### 5.4. Dokümantasyon ve Son Kontroller

| #     | Görev                  | Dosya                                        | Detay                                           |
| ----- | ---------------------- | -------------------------------------------- | ----------------------------------------------- |
| 5.4.1 | README güncelleme      | `README.md`                                  | Kurulum, env değişkenleri, API endpoint listesi |
| 5.4.2 | API dokümantasyonu     | `docs/api.md` (opsiyonel)                    | Endpoint'ler, request/response örnekleri        |
| 5.4.3 | Smoke test checklist   | `docs/smoke-test.md`                         | 15 UC'nin manuel adım adım testi                |
| 5.4.4 | `/privacy` ve `/terms` | `app/privacy/page.tsx`, `app/terms/page.tsx` | Placeholder içerik (tek paragraf)               |

### 5.5. Testler

| #     | Test        | Dosya                               | Kapsam                                  |
| ----- | ----------- | ----------------------------------- | --------------------------------------- |
| 5.5.1 | Integration | `tests/integration/account.test.ts` | Delete account (başarı + yanlış parola) |
| 5.5.2 | Integration | `tests/integration/smoke.test.ts`   | Tüm happy path'lerin ardışık çalışması  |

**Sprint 5 Bitiş Kriteri:**  
Hesap silme çalışıyor. Tüm 15 UC manuel smoke test'ten geçti. XSS/CSRF kontrolleri yapıldı. Lighthouse 85+. Chrome ve Safari'de sorunsuz.

---

## 6. Implementasyon Sırası ve Bağımlılık Grafiği

```
Sprint 0
├── 0.1 Repo + CI
├── 0.2 Next.js + Tailwind + shadcn
├── 0.3 Drizzle + Neon (schema + migration)
├── 0.4 iron-session
├── 0.5 Validators
├── 0.6 Error handling
└── 0.7 Seed + Vitest
    │
    ▼
Sprint 1 (bağımlı: 0.3, 0.4, 0.5, 0.6)
├── 1.1 AuthController
├── 1.2 Reset token DB
├── 1.3 Auth API routes
├── 1.4 middleware.ts
├── 1.5 Auth pages (register/login/reset)
└── 1.6 Auth tests
    │
    ▼
Sprint 2 (bağımlı: 1.4, 1.5)
├── 2.1 PortfolioController
├── 2.2 Portfolio API routes
├── 2.3 Dashboard UI (onboarding, profile, theme, publish)
├── 2.4 User profile API
└── 2.5 Portfolio tests
    │
    ▼
Sprint 3 (bağımlı: 2.1, 2.2)
├── 3.1 ProjectController
├── 3.2 LinkController
├── 3.3 getIconForUrl
├── 3.4 Project/Link API routes
├── 3.5 Dashboard content UI
└── 3.6 Content tests
    │
    ▼
Sprint 4 (bağımlı: 2.1, 3.1, 3.2)
├── 4.1 Public [slug] page (SSG/ISR)
├── 4.2 ThemeProvider + Public components
├── 4.3 GitHub import API
├── 4.4 GitHub import UI
└── 4.5 Public view tests
    │
    ▼
Sprint 5 (bağımlı: 1–4)
├── 5.1 Delete account API + UI
├── 5.2 Security audit
├── 5.3 Performance + Polish
├── 5.4 Documentation
└── 5.5 Final tests
```

---

## 7. Kodlama Kuralları ve Kalite Kontrol Listesi

Her görev tamamlandığında bu kontrol listesi kullanılır:

- [ ] **BCE Kuralı:** Route handler doğrudan `db`'yi çağırmıyor; Controller üzerinden geçiyor.
- [ ] **Zod:** API route'ta `req.json()` sonrası `.safeParse()` veya `.parse()` kullanılıyor.
- [ ] **Auth:** Korunan route'ta `requireAuth()` çağrılmış.
- [ ] **Sahiplik:** Update/Delete işlemlerinde "kaynak bu kullanıcıya mı ait?" kontrolü var.
- [ ] **Hata:** Kullanıcıya jenerik mesaj; teknik detay `console.error`'a.
- [ ] **Tip:** `any` kullanılmamış; bilinmeyen tip `unknown` + narrowing.
- [ ] **Test:** Yeni controller metodu için birim test; yeni route için integration test.
- [ ] **UI:** Form'da `react-hook-form` + `zodResolver` kullanılıyor.
- [ ] **XSS:** Kullanıcı girdisi `dangerouslySetInnerHTML`'e gitmiyor.

---

## 8. Risk Yönetimi ve Yedek Planlar

| Risk                                | Tetikleyici                     | Yedek Plan                                                                          |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| iron-session + Next 16 uyumsuzluğu  | `getIronSession` hata verirse   | Fallback: `jose` (JWT) + cookie manuel yönetimi; Tech Lead 1 gün içinde karar verir |
| Neon bağlantı sorunu                | `drizzle-kit migrate` başarısız | Yerel PostgreSQL Docker ile devam; production deploy sonrası geçiş                  |
| GitHub API rate limit               | Import sırasında 403            | Kullanıcıya "Rate limit aşıldı, 1 saat sonra tekrar deneyin" mesajı; token rotate   |
| shadcn/ui + Tailwind v4 uyumsuzluğu | Bileşen stil bozukluğu          | Bileşen kaynağı manuel override; v3'e downgrade değerlendirilir                     |
| Ekip üyesi görevi yetiştiremez      | Cuma demo hazır değil           | Görev küçük parçalara bölünür; "pair programming" ile destek                        |

---

Bu plan, **kod yazmaya başlamadan önce son kontrol noktasıdır.** Her sprint başında ilgili bölüm gözden geçirilir, ekip üyelerine atanır ve günlük standuplarda ilerleme takip edilir.
