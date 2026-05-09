# Proof-Based Portfolio Platform — Yaşayan Proje Dokümanı (Living PRD)

> **Versiyon:** 1.0.0  
> **Son Güncelleme:** 2026-05-07  
> **Durum:** MVP Geliştirme Aşamasında  
> **Dil:** Türkçe (Teknik terimler orijinal haliyle korunmuştur)  
> **Ekip:** Ali Akbayrak, Elif İpek Kaynar, Mustafa Pekkirişci, Rabia Şahin, Selime Buse Yanal, Şeyda Öksüzoğlu  
> **Ders:** BİL 204 / Yazılım Mühendisliği

---

## 1. Dokümanın Amacı ve Kullanımı

Bu doküman, "Proof-Based Portfolio Platform" projesinin **tek doğruluk kaynağı (Single Source of Truth)** olarak hizmet eden, geliştirme süreci boyunca sürekli güncellenen **yaşayan bir dokümandır (living document)**. Projenin vizyonundan, mimari kararlarına, veri modelinden UI bileşenlerine, sprint planından risk yönetimine kadar tüm bilgileri kapsar.

**Güncelleme Kuralı:** Her sprint sonunda, her önemli mimari değişiklikte ve her yeni özellik eklenişinde bu doküman ilgili bölümleriyle birlikte güncellenir. Ekip üyeleri kod yazmadan önce bu dokümana başvurur.

---

## 2. Proje Özeti ve Vizyon

### 2.1. Vizyon

Yazılım geliştiricilerin projelerini, teknik yetkinliklerini ve sosyal bağlantılarını **bento.me** veya **linktr.ee** sadeliğinde, minimal ve kanıt temelli (proof-based) bir arayüz üzerinden sergileyebilecekleri bir platform sunmak. Geliştiriciler yetkinliklerini sadece beyan etmekle kalmaz; canlı demo bağlantıları ve GitHub kaynak kodu erişimi ile doğrulanabilir bir dijital profil oluşturur.

### 2.2. Temel Değer Önermesi

- **Kanıt Temelli (Proof-Based):** Her proje için canlı demo ve kaynak kod bağlantısı zorunlu kılınarak "sözde değil, kanıtlı" bir portföy sunulur.
- **Minimalizm:** Karmaşık ayarlar, sürükle-bırak editörler yoktur. Sezgisel form girişleri ve hızlı yapılandırma.
- **Hızlı ve Güvenilir:** SSG/ISR ile CDN'den sunulan public portföy sayfaları; şifrelenmiş oturum yönetimi ile güvenli yönetim paneli.

### 2.3. Hedef Kitle

Bireysel yazılım geliştiriciler, tasarımcılar ve teknik çalışmalarını profesyonel olarak sunmak isteyen kullanıcılar.

---

## 3. Kapsam, Sınırlar ve Varsayımlar

### 3.1. MVP Kapsamı (Sprint 0–5)

| Modül             | İçerik                                                                                |
| ----------------- | ------------------------------------------------------------------------------------- |
| Kimlik Doğrulama  | Email + parola ile kayıt, giriş, çıkış, parola sıfırlama                              |
| Portföy Yönetimi  | Slug tabanlı benzersiz URL, tema seçimi (light/dark), yayınla/gizle                   |
| Profil Yönetimi   | Tam ad, biyografi (max 500 karakter), avatar URL'si                                   |
| Proje Yönetimi    | CRUD işlemleri, görünürlük toggle, GitHub'dan içe aktarma                             |
| Bağlantı Yönetimi | Sosyal medya ve dış bağlantı ekleme/düzenleme/silme, otomatik ikon eşleştirme         |
| Public View       | `app/[slug]` rotasında SSG/ISR ile sunulan, tema destekli salt okunur portföy sayfası |

### 3.2. MVP Dışında Bilinçli Bırakılanlar (İleri Sürüm)

- Görsel yükleme (Vercel Blob) — MVP'de kullanıcı dış URL girer.
- Drag & drop sıralama — `createdAt DESC` ile otomatik sıralama.
- Rate limiting (Upstash Redis).
- Sentry ile production hata izleme.
- Playwright E2E testleri.
- Husky + lint-staged pre-commit hook'ları.
- KVKK veri export endpoint'i.
- Dinamik OG image (`opengraph-image.tsx`).
- Sitemap / `robots.ts`.
- OAuth (GitHub Login, Google Login).
- Çoklu tema (5+) ve özel tema editörü.

### 3.3. Sözde Gereksinimler (Pseudo Requirements — Değişmez Kısıtlar)

1. Backend ayrı bir framework olarak yazılmayacak; sadece Next.js API Routes kullanılacak.
2. İlk sürümde OAuth/GitHub Login yok; sadece email + parola.
3. Veri modeli kesinlikle sadece **User, Portfolio, Project, Link** nesneleri üzerinden kurulacak; ekstra tablo açılmayacak.
4. Her API route handler'da Zod doğrulaması zorunlu.
5. Her controller fonksiyonu için en az bir Vitest birim testi zorunlu.
6. Parola asla düz metin saklanmayacak.
7. TypeScript strict mode zorunlu; `any` tipi yasak.

---

## 4. Ekip ve Sorumluluk Matrisi

| #   | Üye | Rol                           | Asıl Sorumluluk                                                    |
| --- | --- | ----------------------------- | ------------------------------------------------------------------ |
| 1   | —   | Proje Yöneticisi              | Sprint takibi, dokümantasyon, risk yönetimi + küçük UI parçası     |
| 2   | —   | Tech Lead                     | Mimari, code review, DB şeması, auth altyapısı, AGENTS.md yönetimi |
| 3   | —   | Backend / Auth                | `/api/auth/*`, bcrypt hashleme, session, password reset            |
| 4   | —   | Backend / Data & Integrations | Portfolio/Project/Link CRUD, slug kontrolü, GitHub import          |
| 5   | —   | Frontend / Dashboard          | Login/Register, Dashboard, Project Modal (Ekran 1, 2, 3)           |
| 6   | —   | Frontend / Public View        | `[slug]` rotası, tema sistemi, bento grid (Ekran 4)                |

**Çalışma Modeli:** Her sprint'te bir backend + bir frontend ikilisi "pair" olarak aynı use case'i uçtan uca beraber götürür. `main` branch korumalıdır; doğrudan push yok, PR + en az 1 onay şarttır.

---

## 5. Teknoloji Yığını ve Altyapı

### 5.1. Kesin Teknoloji Listesi

> **Not:** `plan.md` dosyasında ORM olarak Prisma geçmiş olmakla birlikte, `sdd.md` ve `design-report-prompt.md` teknik dokümanlarında **Drizzle ORM** kesin olarak belirtilmiştir. Ayrıca auth konusunda `iron-session` yapısı tüm teknik dokümanlarda (SDD, design-report) sabitlenmiştir. Bu yaşayan doküman, projenin teknik tasarım dokümanlarına (SDD) uygun olarak **Drizzle ORM** ve **iron-session**'ı esas alır.

| Katman           | Teknoloji        | Versiyon / Detay                                               |
| ---------------- | ---------------- | -------------------------------------------------------------- |
| Framework        | Next.js          | 16.2.x (App Router)                                            |
| Runtime          | React            | 19.x                                                           |
| Dil              | TypeScript       | 5.x (strict mode, `any` yasak)                                 |
| Veritabanı       | PostgreSQL       | Neon (serverless hosting)                                      |
| ORM              | **Drizzle**      | `drizzle-orm/neon-http` veya `neon-serverless` ile             |
| Stil             | Tailwind CSS     | v4 (`@theme` direktifi ile)                                    |
| UI Bileşenleri   | shadcn/ui        | Radix UI tabanlı                                               |
| Form Yönetimi    | React Hook Form  | + Zod resolver                                                 |
| Doğrulama        | Zod              | Tüm API katmanlarında zorunlu                                  |
| Kimlik Doğrulama | **iron-session** | Şifrelenmiş cookie tabanlı stateless session                   |
| Şifre Hashleme   | bcrypt           | cost ≥ 10 (dev), 12 (prod)                                     |
| E-posta          | Resend           | Parola sıfırlama için; dev ortamında API key yoksa konsola log |
| Test             | Vitest           | Birim + integration testleri                                   |
| CI/CD            | GitHub Actions   | Lint + type-check + test                                       |
| Deployment       | Vercel           | Preview + production                                           |
| Versiyon Kontrol | Git + GitHub     | Conventional Commits                                           |

### 5.2. iron-session Yapılandırması

- **Cookie adı:** `portfolio-session`
- **Şifreleme:** `AUTH_SECRET` env değişkeni (min 32 karakter)
- **TTL:** 7 gün
- **Cookie özellikleri:** HttpOnly, Secure (prod), SameSite=Lax

### 5.3. Önemli Versiyon Uyarıları (Next.js 16 / React 19 / Tailwind v4)

- `cookies()` ve `headers()` artık **async**; `await cookies()` şeklinde kullanılır.
- `params` ve `searchParams` artık **Promise**; `const { slug } = await params` şeklinde çözümlenir.
- `forwardRef` artık gereksizdir; `ref` normal prop olarak alınır.
- Tailwind v4'te `tailwind.config.js` yoktur; yapılandırma `@theme` ile CSS içinde yapılır.
- `fetch()` varsayılan olarak cache etmez; açıkça `cache: "force-cache"` veya `next: { revalidate }` belirtilmelidir.

---

## 6. Mimari Prensipler ve Katmanlı Yapı (BCE)

Sistem, **BCE (Boundary — Control — Entity)** prensibine göre katmanlara ayrılmıştır. Bağımlılık yönü tek yönlüdür: **Boundary → Control → Entity**.

### 6.1. Katman Tanımları

| Katman                   | Stereotip      | Görevi                                                      | Fiziksel Konum                                                       |
| ------------------------ | -------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| **Presentation Layer**   | `<<boundary>>` | Kullanıcıyla doğrudan temas; sayfalar ve React bileşenleri  | `app/(auth)/`, `app/(dashboard)/`, `app/[slug]/`, `components/`      |
| **API Layer**            | `<<boundary>>` | HTTP isteklerini karşılama; route handler'lar ve middleware | `app/api/*`, `middleware.ts`                                         |
| **Business Logic Layer** | `<<control>>`  | İş kuralları, doğrulama, oturum yönetimi                    | `lib/controllers/`, `lib/auth.ts`, `lib/validators/`, `lib/email.ts` |
| **Data Access Layer**    | `<<entity>>`   | Veritabanı şema tanımları ve singleton erişim noktası       | `lib/db/schema.ts`, `lib/db/index.ts`                                |
| **Database Layer**       | —              | Kalıcı veri saklama                                         | Neon PostgreSQL                                                      |

### 6.2. Kritik Mimari Kural

**Bir route handler asla doğrudan Drizzle/db instance'ını çağıramaz.** Route handler sadece HTTP detaylarıyla (parse, response, status code) ilgilenir. İş mantığı ve veritabanı erişimi mutlaka Controller katmanı üzerinden geçer.

### 6.3. Klasör Yapısı

```
portfolio-app/
├── app/
│   ├── (auth)/              # Login, Register, Reset Password sayfaları
│   ├── (dashboard)/         # Dashboard, Projects, Settings
│   ├── [slug]/              # Public portfolio view (SSG/ISR)
│   ├── api/                 # Route handlers
│   ├── error.tsx            # Global error boundary
│   ├── not-found.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn/ui bileşenleri
│   ├── dashboard/           # ProjectCard, LinkCard, ProjectModal, vb.
│   └── portfolio/           # BentoGrid, ThemeProvider, ProfileCard
├── lib/
│   ├── controllers/         # AuthController, PortfolioController, ProjectController, LinkController
│   ├── db/                  # schema.ts, index.ts (singleton), seed.ts
│   ├── auth.ts              # Session helpers (getSession, requireAuth)
│   ├── email.ts             # Resend wrapper
│   └── validators/          # Zod şemaları + reserved-slugs.ts
├── drizzle/                 # Migration dosyaları
├── drizzle.config.ts
├── tests/
│   ├── unit/                # Controller birim testleri
│   └── integration/         # API route handler testleri
├── .github/workflows/ci.yml
└── public/
```

---

## 7. Veri Modeli ve Kalıcı Veri Yönetimi

### 7.1. Entity Yapıları ve İlişkiler

**İlişki Özeti:**

- `User` (1) — `owns` → `Portfolio` (0..1): Bire-bir sahiplik. Kullanıcı silindiğinde portföy **ON DELETE CASCADE** ile silinir.
- `Portfolio` (1) — `contains` → `Project` (0..\*): Bire-çok.
- `Portfolio` (1) — `contains` → `Link` (0..\*): Bire-çok.
- Portfolio silindiğinde Project ve Link'ler cascade silinir.

### 7.2. Veritabanı Şeması (Drizzle ORM)

```typescript
// lib/db/schema.ts (Taslak — Drizzle pgTable syntax'ı)

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 100 }),
  bio: varchar("bio", { length: 500 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolio = pgTable("portfolio", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  theme: varchar("theme", { length: 50 }).default("minimal-light").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const project = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolio.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: varchar("description", { length: 1000 }),
  imageUrl: text("image_url"),
  demoUrl: text("demo_url"),
  githubUrl: text("github_url"),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const link = pgTable("link", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolio.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 50 }).notNull(),
  url: text("url").notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 7.3. Önemli Alan Kuralları

| Alan                    | Kural                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| `email`                 | UNIQUE, lowercase normalize, Zod `.email()`                        |
| `passwordHash`          | bcrypt cost 10 (dev) / 12 (prod). Asla düz metin.                  |
| `slug`                  | UNIQUE, regex `^[a-z0-9][a-z0-9-]{2,30}$`, rezerve kelime kontrolü |
| `bio`                   | max 500 karakter                                                   |
| `fullName`              | max 100 karakter                                                   |
| `title` (Project)       | max 100 karakter                                                   |
| `description` (Project) | max 1000 karakter                                                  |
| `title` (Link)          | max 50 karakter                                                    |
| `theme`                 | String ID, default `"minimal-light"`                               |
| `avatarUrl`, `imageUrl` | Kullanıcı dış URL girer (MVP'de upload yok)                        |
| URL alanları            | Zod `.url()` + `https://` prefix zorunlu                           |

### 7.4. Slug Rezerve Listesi

```typescript
// lib/validators/reserved-slugs.ts
export const RESERVED_SLUGS = [
  "api",
  "dashboard",
  "login",
  "register",
  "reset-password",
  "settings",
  "admin",
  "_next",
  "public",
  "app",
  "about",
  "terms",
  "privacy",
  "static",
  "assets",
] as const;
```

---

## 8. Sınıf Tasarımı ve Arayüzler

### 8.1. Control Sınıfları (İş Mantığı)

#### AuthController (`lib/controllers/auth-controller.ts`)

| Metot                  | İmza                                                            | Açıklama                                                                          | Fırlatabileceği Hatalar                                        |
| ---------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `register`             | `register(data: RegisterInput): Promise<User>`                  | Yeni kullanıcı kaydeder, email benzersizliği ve bcrypt hash uygular               | `ConflictError` (email zaten kayıtlı), `ValidationError`       |
| `login`                | `login(data: LoginInput): Promise<SessionUser>`                 | Kimlik bilgilerini doğrular, iron-session cookie oluşturur                        | `AuthenticationError` (jenerik: "Email or password incorrect") |
| `logout`               | `logout(): Promise<void>`                                       | Mevcut session'ı yok eder, cookie'yi temizler                                     | —                                                              |
| `requestPasswordReset` | `requestPasswordReset(email: string): Promise<void>`            | Tek kullanımlık token üretir (cuid + hash, 1 saat TTL), Resend ile email gönderir | Dışarıya hata sızdırmaz (hesap yoksa bile 200 döner)           |
| `confirmPasswordReset` | `confirmPasswordReset(data: ResetInput): Promise<void>`         | Token doğrulama, yeni parola hash, token invalidate, tüm sessionları sonlandırma  | `InvalidTokenError`, `TokenExpiredError`                       |
| `hashPassword`         | `hashPassword(plain: string): Promise<string>`                  | bcrypt ile hash üretir (cost: 10/12)                                              | —                                                              |
| `verifyPassword`       | `verifyPassword(plain: string, hash: string): Promise<boolean>` | Hash karşılaştırması yapar                                                        | —                                                              |

#### PortfolioController (`lib/controllers/portfolio-controller.ts`)

| Metot                   | İmza                                                                        | Açıklama                                                                                                                  | Fırlatabileceği Hatalar               |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `createPortfolio`       | `createPortfolio(userId: string, data: PortfolioInput): Promise<Portfolio>` | Kullanıcıya ait ilk portföyü oluşturur. Slug benzersizlik ve rezerve kontrolü yapar. Kullanıcı başına yalnızca 1 portföy. | `ValidationError`, `ConflictError`    |
| `getPublicPortfolio`    | `getPublicPortfolio(slug: string): Promise<PublicPortfolio>`                | Slug üzerinden yayınlanmış portföyü getirir. Sadece `isPublished=true` ve `isVisible=true` içerikleri birleştirir         | `NotFoundError`                       |
| `updatePortfolio`       | `updatePortfolio(id: string, data: PortfolioInput): Promise<Portfolio>`     | Tema, slug veya yapılandırma günceller. Slug değişikliğinde çakışma kontrolü tekrarlanır                                  | `NotFoundError`, `AuthorizationError` |
| `publishPortfolio`      | `publishPortfolio(id: string, status: boolean): Promise<Portfolio>`         | `isPublished` durumunu günceller. Yayınlama sonrası `revalidatePath()` ile ISR önbelleği temizlenir                       | `NotFoundError`, `AuthorizationError` |
| `checkSlugAvailability` | `checkSlugAvailability(slug: string): Promise<boolean>`                     | Slug'in veritabanında mevcut olup olmadığını ve rezerve listeye takılıp takılmadığını kontrol eder                        | `ValidationError`                     |

#### ProjectController (`lib/controllers/project-controller.ts`)

| Metot              | İmza                                                                                   | Açıklama                                                                                                                              | Fırlatabileceği Hatalar                                                          |
| ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `createProject`    | `createProject(portfolioId: string, data: ProjectInput): Promise<Project>`             | Portföy altına yeni proje oluşturur. Varsayılan `isVisible=true`                                                                      | `ValidationError`, `NotFoundError`, `AuthorizationError`                         |
| `updateProject`    | `updateProject(id: string, data: ProjectInput): Promise<Project>`                      | Proje alanlarını günceller. Sahiplik kontrolü yapılır                                                                                 | `NotFoundError`, `AuthorizationError`, `ValidationError`                         |
| `deleteProject`    | `deleteProject(id: string): Promise<void>`                                             | Projeyi kalıcı olarak siler                                                                                                           | `NotFoundError`, `AuthorizationError`                                            |
| `toggleVisibility` | `toggleVisibility(id: string): Promise<Project>`                                       | `isVisible` boolean'ını tersine çevirir                                                                                               | `NotFoundError`, `AuthorizationError`                                            |
| `importFromGitHub` | `importFromGitHub(portfolioId: string, githubUsername: string): Promise<ImportResult>` | GitHub REST API'den public repoları çeker. Çakışma varsa update, yoksa create. Rate limit kontrolü dahilinde tek senkron HTTP çağrısı | `NotFoundError`, `AuthorizationError`, `ExternalServiceError`, `ValidationError` |

#### LinkController (`lib/controllers/link-controller.ts`)

| Metot        | İmza                                                              | Açıklama                                                                                                                          | Fırlatabileceği Hatalar                                  |
| ------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `createLink` | `createLink(portfolioId: string, data: LinkInput): Promise<Link>` | Yeni bağlantı oluşturur. URL formatı `https://` zorunlu. `icon` boş bırakılırsa `lib/get-icon-for-url.ts` ile otomatik eşleştirme | `ValidationError`, `NotFoundError`, `AuthorizationError` |
| `updateLink` | `updateLink(id: string, data: LinkInput): Promise<Link>`          | Bağlantı bilgilerini günceller                                                                                                    | `NotFoundError`, `AuthorizationError`, `ValidationError` |
| `deleteLink` | `deleteLink(id: string): Promise<void>`                           | Bağlantıyı kalıcı olarak kaldırır                                                                                                 | `NotFoundError`, `AuthorizationError`                    |

### 8.2. Boundary Sınıfları (UI Bileşenleri)

#### Authentication Boundary

- **LoginForm** (`components/auth/login-form.tsx`): Email + parola girişi. React Hook Form + Zod.
- **RegisterForm** (`components/auth/register-form.tsx`): Yeni kullanıcı kaydı.

#### Dashboard Boundary

- **ProjectModal** (`components/dashboard/project-modal.tsx`): Proje ekleme/düzenleme modalı. Create ve edit modları `initialValues` prop'u ile aynı bileşende.
- **LinkModal** (`components/dashboard/link-modal.tsx`): Bağlantı ekleme/düzenleme modalı.
- **ProfileEditor** (`components/dashboard/profile-editor.tsx`): `fullName`, `bio`, `avatarUrl` düzenleme.
- **ThemeSelector** (`components/dashboard/theme-selector.tsx`): Tema seçimi bileşeni.

#### Public View Boundary

- **BentoGrid** (`components/portfolio/bento-grid.tsx`): Proje ve bağlantıların grid düzeninde gösterimi.
- **ProfileCard** (`components/portfolio/profile-card.tsx`): Kullanıcı profil bilgileri.
- **ProjectCard** (`components/portfolio/project-card.tsx`): Tek projenin görsel temsili.
- **LinkCard** (`components/portfolio/link-card.tsx`): Tek bağlantının sunumu.
- **ThemeProvider** (`components/portfolio/theme-provider.tsx`): React Context ile tema bilgisi paylaşımı. CSS değişkenlerini günceller.

### 8.3. Yardımcı Sınıflar ve Şemalar

- **Zod Validators:** `RegisterSchema`, `LoginSchema`, `ProjectSchema`, `LinkSchema`, `SlugSchema`
- **SessionHelpers** (`lib/auth.ts`): `getSession()`, `requireAuth()`
- **DrizzleDB** (`lib/db/index.ts`): Singleton desen ile `db` instance'ı. Geliştirme ortamında `globalThis` üzerinden paylaşım (hot-reload koruması).

---

## 9. API Tasarımı ve Endpoint Haritası

| Method   | Endpoint                             | Açıklama                                      | Auth                     |
| -------- | ------------------------------------ | --------------------------------------------- | ------------------------ |
| `POST`   | `/api/auth/register`                 | Yeni kullanıcı kaydı                          | Public                   |
| `POST`   | `/api/auth/login`                    | Giriş, session cookie oluşturma               | Public                   |
| `POST`   | `/api/auth/logout`                   | Çıkış, cookie temizleme                       | Required                 |
| `POST`   | `/api/auth/reset-password/request`   | Sıfırlama token'ı üretme ve email gönderme    | Public                   |
| `POST`   | `/api/auth/reset-password/confirm`   | Token doğrulama ve yeni parola                | Public                   |
| `POST`   | `/api/portfolio`                     | Portföy oluşturma (1 kullanıcı = 1 portföy)   | Required                 |
| `PATCH`  | `/api/portfolio/[id]`                | Portföy güncelleme (tema, slug, yayın durumu) | Required (sadece sahibi) |
| `GET`    | `/api/portfolio/check-slug?slug=...` | Slug müsaitlik kontrolü                       | Public                   |
| `GET`    | `/api/portfolio/public/[slug]`       | Public portföy verisi (SSG/ISR için)          | Public                   |
| `POST`   | `/api/projects`                      | Yeni proje ekleme                             | Required                 |
| `GET`    | `/api/projects`                      | Kullanıcının projelerini listeleme            | Required                 |
| `PATCH`  | `/api/projects/[id]`                 | Proje güncelleme                              | Required (sadece sahibi) |
| `DELETE` | `/api/projects/[id]`                 | Proje silme                                   | Required (sadece sahibi) |
| `PATCH`  | `/api/projects/[id]/visibility`      | Görünürlük toggle                             | Required (sadece sahibi) |
| `POST`   | `/api/links`                         | Yeni bağlantı ekleme                          | Required                 |
| `GET`    | `/api/links`                         | Bağlantıları listeleme                        | Required                 |
| `PATCH`  | `/api/links/[id]`                    | Bağlantı güncelleme                           | Required (sadece sahibi) |
| `DELETE` | `/api/links/[id]`                    | Bağlantı silme                                | Required (sadece sahibi) |
| `POST`   | `/api/github/import`                 | GitHub'dan repo içe aktarma                   | Required                 |
| `PATCH`  | `/api/user/profile`                  | Profil bilgisi güncelleme                     | Required                 |
| `DELETE` | `/api/account`                       | Hesap ve tüm verileri silme (cascade)         | Required                 |

---

## 10. Güvenlik, Kimlik Doğrulama ve Erişim Kontrolü

### 10.1. Kimlik Doğrulama

- **iron-session** ile stateless, şifrelenmiş cookie yapısı.
- Sunucu tarafında session kaydı tutulmaz; logout cookie'nin temizlenmesiyle gerçekleşir.
- Cookie: `portfolio-session`, HttpOnly + Secure (prod) + SameSite=Lax, 7 gün TTL.

### 10.2. Parola Güvenliği

- bcrypt algoritması ile hash'lenir.
- Cost faktörü: geliştirme ortamında **10**, production'da **12**.

### 10.3. Girdi Denetimi

- Tüm katmanlar arası veri geçişlerinde **Zod şemaları** kullanılır.
- "Mass Assignment" ve tip tabanlı manipülasyonların önüne geçilir.

### 10.4. Hata Yönetimi ve Bilgi Sızdırmama

- Güvenlik hassasiyeti olan süreçlerde (şifre sıfırlama, login) kullanıcıya spesifik bilgiler verilmez.
- Sistem dışarıya idempotent ve jenerik mesajlar döner:
  - ❌ `"Email not found"` → ✅ `"Email or password incorrect"`
  - ❌ `"User with id 42 not found"` → ✅ `"Not found"`
  - ❌ `"Prisma error: P2002"` → ✅ `"This email is already registered"`
- Stack trace sadece sunucu log'una yazılır; kullanıcıya gösterilmez.

### 10.5. Erişim Kontrol Matrisi

| İşlev / Aktör              | Ziyaretçi (Guest)           | Kullanıcı (User)            |
| -------------------------- | --------------------------- | --------------------------- |
| Kayıt Ol (Register)        | ✓                           | ✗                           |
| Giriş Yap (Login)          | ✓                           | ✗                           |
| Parola Sıfırlama Talebi    | ✓                           | ✗                           |
| Parola Sıfırlama Onaylama  | ✓                           | ✗                           |
| Portföy Oluşturma          | ✗                           | ✓ (kendisi için, 1 adet)    |
| Portföy Güncelleme         | ✗                           | ✓ (sadece kendi)            |
| Portföy Yayınla/Gizle      | ✗                           | ✓ (sadece kendi)            |
| Profil Güncelleme          | ✗                           | ✓ (sadece kendi)            |
| Proje CRUD                 | ✗                           | ✓ (sadece kendi portföyü)   |
| Link CRUD                  | ✗                           | ✓ (sadece kendi portföyü)   |
| GitHub Import              | ✗                           | ✓ (sadece kendi portföyü)   |
| Hesap Silme                | ✗                           | ✓ (sadece kendi)            |
| Public Portföy Görüntüleme | ✓ (sadece isPublished=true) | ✓ (sadece isPublished=true) |
| Slug Müsaitlik Kontrolü    | ✓                           | ✓                           |

### 10.6. CSRF ve XSS Önlemleri

- **CSRF:** SameSite=Lax cookie + POST/PATCH/DELETE isteklerinde origin kontrolü.
- **XSS:** React default escape mekanizması + `dangerouslySetInnerHTML` kesinlikle yasak.
- **Session Storage Yasak:** `localStorage` veya `sessionStorage` ile session yönetimi yapılmaz.

---

## 11. UI/UX Tasarımı ve Bileşen Kataloğu

### 11.1. Tasarım Hedefleri

- **Kullanılabilirlik:** Sıfır eğitim ihtiyacı; sezgisel navigasyon ve hızlı form girişleri.
- **Minimalizm:** bento.me / linktr.ee sadeliğinde; karmaşık menülerden arındırılmış.
- **Responsive:** Mobil, tablet ve masaüstü cihazlarda görsel bütünlük.

### 11.2. Ekran Tanımları (Wireframe → Yüksek Çözünürlük)

#### Ekran 1: Kayıt ve Kimlik Doğrulama Arayüzü

- Merkeze hizalanmış sade form yapısı.
- Alanlar: email, fullName, password.
- Alt bağlantı: "Already have an account? Login"

#### Ekran 2: Yönetim Paneli (Dashboard)

- **Üst kısım:** Profil bilgileri düzenleme (avatar URL input, bio textarea + karakter sayacı, fullName).
- **Alt kısım:** Proje ve Link grid listesi (`createdAt DESC`).
- Her öğede: düzenleme, silme, görünürlük toggle ikonları.
- Boş durum: "No projects yet. Add your first one →"

#### Ekran 3: Proje Ekleme/Düzenleme Formu (Modal)

- shadcn `Dialog` bileşeni; sayfa yenilenmeden açılır.
- Alanlar: title, description (textarea), demoUrl, githubUrl, imageUrl.
- Onay/İptal butonları.

#### Ekran 4: Genel Portföy Görünümü (Public View)

- Bento stili grid yerleşimi.
- Üstte: ProfileCard (avatar + fullName + bio).
- Altta: Görünür projeler (ProjectCard) ve bağlantılar (LinkCard).
- Tamamen salt okunur; tema CSS değişkenleri ile uygulanır.

### 11.3. Tema Sistemi (MVP)

2 tema ile başlanır; her biri CSS custom property seti:

```css
/* themes/minimal-light.css */
:root[data-theme="minimal-light"] {
  --color-bg: #ffffff;
  --color-fg: #0a0a0a;
  --color-accent: #2563eb;
  --color-muted: #737373;
  --font-display: "Inter", sans-serif;
  --radius: 0.5rem;
}
```

Public view'da `<html data-theme="...">` SSR'da set edilir; hydration mismatch önlenir.

---

## 12. Küresel Kontrol Akışı ve İş Akışları

### 12.1. Genel Akış

Sistem, **senkron, request-response tabanlı HTTP** kontrol akışı üzerine kuruludur. Asenkron mekanizmalar (mesaj kuyruğu, background job, websocket) MVP kapsamı dışındadır.

**Tipik İstek Zinciri:**

```
Browser → middleware.ts (session doğrulama)
  → app/api/* route handler (HTTP parse + Zod validation)
    → lib/controllers/* (iş mantığı)
      → lib/db/index.ts (Drizzle singleton)
        → Neon PostgreSQL
```

### 12.2. Render Stratejileri

| Rota                  | Strateji                | Açıklama                                                                                                         |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/[slug]/page.tsx` | SSG/ISR                 | Sayfa CDN'den önbelleklenir. Kullanıcı güncelleme yayınladığında `revalidatePath()` ile cache invalidate edilir. |
| `app/(dashboard)/*`   | SSR + Client Components | İlk render sunucuda; sonraki etkileşimler Client Component'lerde optimistic UI ile yürür.                        |
| `app/(auth)/*`        | SSR                     | Statik sayfalar.                                                                                                 |
| GitHub Import         | Senkron HTTP            | Tek API çağrısı; rate limit kontrolü dahilinde.                                                                  |

### 12.3. Hata Yönetimi Hiyerarşisi

- **API Route Handler:** Zod validation hataları (400), auth hataları (401/403), not found (404).
- **Controller:** İş mantığı hataları (NotFoundError, AuthorizationError, vb.).
- **Global:** `app/error.tsx` (beklenmeyen hatalar), `app/not-found.tsx` (404 sayfaları).
- **Sunucu Logları:** Teknik detaylar ve stack trace'ler sadece sunucu tarafında loglanır.

---

## 13. Sprint Planı ve Geliştirme Adımları

> **Toplam Süre:** 4–5 Hafta (1 haftalık sprintler)  
> **Haftalık Ritim:** Pazartesi planlama (~30 dk), günlük standup (10 dk), Cuma demo + retrospective (~45 dk)

### Sprint 0 — Kurulum ve Altyapı (3–4 gün)

**Hedef:** Tüm ekip aynı projede `npm run dev` çalıştırıp aynı sayfayı görebilmeli.

| Görev                                                              | Efor | Sahip              |
| ------------------------------------------------------------------ | ---- | ------------------ |
| GitHub repo oluşturma, branch protection, PR şablonu               | M    | PM                 |
| `create-next-app` iskeleti (TypeScript + Tailwind + App Router)    | M    | Tech Lead          |
| Tech Lead brief: Next.js 16 breaking changes özeti → AGENTS.md     | S    | Tech Lead          |
| Neon PostgreSQL kurulumu, Drizzle kurulumu, ilk şema ve migration  | M    | Tech Lead          |
| `drizzle/seed.ts` — 1 demo user + 1 portfolio + 3 project + 4 link | S    | Backend/Data       |
| `.env.example` hazırlama                                           | S    | Tech Lead          |
| Tailwind v4 `@theme` yapılandırması, light/dark CSS şablonu        | S    | Frontend/Public    |
| shadcn/ui init + temel bileşenler                                  | M    | Frontend/Dashboard |
| Vercel deployment hattı (preview + production)                     | M    | Tech Lead          |
| Auth seçimi spike'ı (iron-session kesinleştirme)                   | M    | Tech Lead          |
| GitHub Actions CI: lint + type-check + Vitest                      | M    | Tech Lead          |
| Vitest kurulumu, ilk dummy test                                    | S    | Backend/Auth       |
| `app/error.tsx` ve `app/not-found.tsx` iskeleti                    | S    | Frontend/Public    |
| Figma'da 4 ekranın yüksek çözünürlüklü tasarımı                    | L    | PM + Tech Lead     |
| README.md (kurulum + env)                                          | S    | PM                 |

**Bitiş Kriteri:** Boş ana sayfa Vercel'de yayında, CI yeşil, seed çalışıyor, auth yapısı sabitlendi.

---

### Sprint 1 — Kimlik Doğrulama (1 hafta)

**Kapsanan Use Case'ler:** UC-1 (Register), UC-2/UC-6 (Login), UC-11 (Password Reset)

| Görev                                                                                            | Efor | Sahip              |
| ------------------------------------------------------------------------------------------------ | ---- | ------------------ |
| `POST /api/auth/register` — email normalize, bcrypt hash, User oluşturma                         | L    | Backend/Auth       |
| `POST /api/auth/login` — credential kontrolü, iron-session cookie                                | M    | Backend/Auth       |
| `POST /api/auth/logout` — cookie temizleme                                                       | M    | Backend/Auth       |
| `middleware.ts` session koruması — `(dashboard)/*` ve API rotaları                               | M    | Backend/Auth       |
| `POST /api/auth/reset-password/request` — token (cuid + hash, 1 saat TTL), Resend email          | L    | Backend/Auth       |
| `POST /api/auth/reset-password/confirm` — token doğrulama, parola güncelleme, session invalidate | M    | Backend/Auth       |
| Ekran 1: Register/Login form (RHF + Zod + shadcn)                                                | M    | Frontend/Dashboard |
| Şifremi unuttum sayfası                                                                          | M    | Frontend/Dashboard |
| Reset password confirm sayfası (`/reset-password?token=...`)                                     | M    | Frontend/Dashboard |
| Hata mesajı sistemi (shadcn Toast + form/field error)                                            | S    | Frontend/Dashboard |
| Test: AuthController birim, tüm `/api/auth/*` integration                                        | M    | Backend/Auth       |

**Bitiş Kriteri:** Kayıt, giriş, çıkış, parola sıfırlama emaili çalışıyor. Account enumeration testi geçti. Reset token tek kullanımlık.

**Risk:** Bu sprint gecikirse zincirleme tüm sprint'ler aksar. Cuma sonu mutlaka tamam.

---

### Sprint 2 — Portföy Çekirdeği (4–5 gün)

**Kapsanan Use Case'ler:** UC-4 (Create Portfolio), UC-7 (Update Profile), UC-9 (Change Theme), UC-5 (Publish/Unpublish)

| Görev                                                                                    | Efor | Sahip              |
| ---------------------------------------------------------------------------------------- | ---- | ------------------ |
| `POST /api/portfolio` — slug benzersizlik, rezerve kontrolü, regex, 1 user = 1 portfolio | L    | Backend/Data       |
| `PATCH /api/portfolio/[id]` — theme, isPublished toggle, sahiplik kontrolü               | M    | Backend/Data       |
| `PATCH /api/user/profile` — bio, avatarUrl, fullName                                     | M    | Backend/Data       |
| Slug doğrulama helper (`lib/validators/slug.ts`)                                         | S    | Backend/Data       |
| `GET /api/portfolio/check-slug?slug=...`                                                 | S    | Backend/Data       |
| Ekran 2 (üst kısım): Profil düzenleme (optimistic UI)                                    | M    | Frontend/Dashboard |
| Portföy oluşturma onboarding (slug input + canlı debounced doğrulama + tema seçimi)      | M    | Frontend/Dashboard |
| Tema seçim bileşeni (2 tema preview)                                                     | S    | Frontend/Public    |
| Yayınla/Gizle toggle + paylaşılabilir URL + copy-to-clipboard                            | S    | Frontend/Dashboard |
| Test: Slug validator, PortfolioController birim, portfolio + profile integration         | M    | Backend/Data       |

**Bitiş Kriteri:** Onboarding ile slug seçilebiliyor, çakışma ve rezerve kontrolü çalışıyor, tema ve yayın durumu kaydediliyor.

---

### Sprint 3 — İçerik Yönetimi (1 hafta)

**Kapsanan Use Case'ler:** UC-3 (Add Project), UC-8 (Toggle Visibility), UC-13 (Edit), UC-14 (Delete), Link CRUD

| Görev                                                                 | Efor | Sahip              |
| --------------------------------------------------------------------- | ---- | ------------------ |
| Project CRUD: `POST/GET/PATCH/DELETE /api/projects`                   | L    | Backend/Data       |
| Link CRUD: `POST/GET/PATCH/DELETE /api/links`                         | L    | Backend/Data       |
| Otomatik ikon eşleştirme (`lib/get-icon-for-url.ts`)                  | M    | Backend/Data       |
| Ekran 2 (alt kısım): Project ve Link grid listesi                     | M    | Frontend/Dashboard |
| Ekran 3: Proje ekleme/düzenleme modal (Dialog, create/edit birleşik)  | L    | Frontend/Dashboard |
| Link ekleme/düzenleme modal                                           | M    | Frontend/Dashboard |
| Görünürlük toggle (Switch, optimistic UI)                             | M    | Frontend/Dashboard |
| Silme onay dialog (AlertDialog)                                       | M    | Frontend/Dashboard |
| Boş durum (empty state) tasarımı                                      | S    | Frontend/Dashboard |
| Test: İkon eşleştirme, URL validator, Project + Link CRUD integration | M    | Backend/Data       |

**Bitiş Kriteri:** Proje ve link ekleme/düzenleme/silme çalışıyor. Optimistic UI hata durumunda geri alıyor.

---

### Sprint 4 — Public View ve GitHub Entegrasyonu (1 hafta)

**Kapsanan Use Case'ler:** UC-10 (View Portfolio), UC-15 (GitHub Import)

| Görev                                                                         | Efor | Sahip              |
| ----------------------------------------------------------------------------- | ---- | ------------------ |
| `app/[slug]/page.tsx` — SSG/ISR ile public portföy                            | L    | Frontend/Public    |
| `GET /api/portfolio/public/[slug]` — sadece isPublished=true + isVisible=true | M    | Backend/Data       |
| Ekran 4: Bento grid, profil kartı, proje kapakları, link kartları             | L    | Frontend/Public    |
| Tema render katmanı (`<html data-theme="...">` SSR)                           | M    | Frontend/Public    |
| Responsive davranış (mobile/tablet/desktop)                                   | M    | Frontend/Public    |
| `POST /api/github/import` — GitHub REST API, sunucu env `GITHUB_TOKEN`        | L    | Backend/Data       |
| Repo → Project dönüşümü ve çakışma önleme (update/create)                     | M    | Backend/Data       |
| GitHub import UI: kullanıcı adı input + sonuç listesi                         | S    | Frontend/Dashboard |
| 404 sayfası (slug bulunamadı veya yayında değil)                              | S    | Frontend/Public    |
| Test: Public portfolio fetch, GitHub import integration                       | M    | Backend/Data       |

**Bitiş Kriteri:** `app.com/[slug]` görüntülenebiliyor. GitHub import çalışıyor. Yayında olmayan portföyler 404.

---

### Sprint 5 — Polish ve Test (3–4 gün)

**Kapsanan Use Case:** UC-12 (Delete Account)

| Görev                                                  | Efor | Sahip              |
| ------------------------------------------------------ | ---- | ------------------ |
| `DELETE /api/account` — kullanıcı + cascade veri silme | M    | Backend/Auth       |
| Hesap silme onay akışı (parola tekrar isteme)          | M    | Frontend/Dashboard |
| CSRF koruması doğrulama                                | M    | Tech Lead          |
| XSS testi (bio, description, title escape kontrolü)    | M    | Tech Lead          |
| Lighthouse hızlı bakış ve düzeltme                     | M    | Frontend/Public    |
| Chrome ve Safari manuel test                           | M    | Frontend/Public    |
| Mobil responsive test                                  | M    | Frontend/Public    |
| Loading skeleton (dashboard, public view)              | S    | Frontend/Public    |
| Favicon, statik OG image fallback, meta tag'ler        | S    | Frontend/Public    |
| `/privacy` ve `/terms` placeholder sayfaları           | S    | PM                 |
| README final güncelleme + API endpoint listesi         | M    | PM                 |
| Demo verisi ile manuel smoke test (15 UC checklist)    | M    | Tüm Ekip           |

**Bitiş Kriteri:** Hesap silme çalışıyor, tüm 15 UC manuel testten geçti, güvenlik kontrolleri tamam, 2 tarayıcı + mobilde sorunsuz.

---

## 14. Test Stratejisi

| Test Türü         | Araç                  | Kapsam                                                    | Zorunluluk |
| ----------------- | --------------------- | --------------------------------------------------------- | ---------- |
| Birim Test        | Vitest                | Controller sınıfları (her public metot için en az 1 test) | Zorunlu    |
| Integration Test  | Vitest + `@vitest/ui` | API route handler'lar (happy path + error path)           | Zorunlu    |
| CI Pipeline       | GitHub Actions        | Her PR'da lint + type-check + test çalıştırılır           | Zorunlu    |
| Manuel Smoke Test | Checklist             | Her sprint sonunda ilgili UC'lerin kontrolü               | Zorunlu    |
| Lighthouse        | Chrome DevTools       | Performans ve erişilebilirlik kontrolü (Sprint 5)         | Sprint 5   |
| XSS/Security      | Manuel + Otomatik     | Kullanıcı girdilerinin escape edilmesi, CSRF kontrolü     | Sprint 5   |

**Test Kuralları:**

- Her controller fonksiyonu için en az bir birim test.
- Her API route için en az bir integration test (başarılı ve başarısız senaryo).
- Mocking: `vi.mock("@/lib/db", ...)` ile Drizzle/Prisma mock'lanır.
- Test dosya isimlendirmesi: `*.test.ts`

---

## 15. Sınır Koşulları, Hata Yönetimi ve Güvenlik

### 15.1. Başlatma (Initialization)

- Geliştirme: `npm run dev`
- Production: Vercel deploy ile otomatik aktif olma.
- Drizzle `db` instance'ı `lib/db/index.ts` üzerinden singleton olarak init edilir.
- Middleware her istekte `portfolio-session` cookie'sini okur; geçerli oturum varsa dashboard'a, yoksa auth sayfalarına yönlendirir.
- MVP'de başlangıç verisi yoktur; `seed.ts` ile isteğe bağlı test verisi eklenebilir.

### 15.2. Sonlandırma (Termination)

- Kullanıcı logout: iron-session cookie temizlenir, oturum geçersiz hale gelir.
- Cookie TTL (7 gün) dolunca oturum otomatik sona erer.
- Hesap silme: `prisma.user.delete()` (veya Drizzle equivalent) ile cascade tüm veriyi temizler.
- Tüm DB işlemleri ACID özelliklerine uygundur; kesinti durumunda veri bütünlüğü korunur.

### 15.3. Hata Durumları

- **Ağ/Sunucu Hataları:** Serverless fonksiyonlar izole şekilde ele alınır; istemciye HTTP status kodları (4xx, 5xx) döner.
- **Validasyon Hataları:** Zod ile erken aşamada yakalanır; veritabanına hatalı veri yazılmaz.
- **Harici Servis Hataları:** Resend veya GitHub API hatasında işlem iptal edilir; kullanıcıya tekrar denemesi gerektiği bildirilir.
- **Oturum Süresi Dolması:** Kullanıcı otomatik olarak login sayfasına yönlendirilir.

---

## 16. Riskler, Önlemler ve Karar Kaydı (Decision Log)

### 16.1. Aktif Riskler ve Önlemler

| Risk                                            | Olasılık | Etki       | Önlem                                                         |
| ----------------------------------------------- | -------- | ---------- | ------------------------------------------------------------- |
| Sprint 1 (auth) gecikmesi                       | Orta     | Çok Yüksek | Tech Lead + Backend/Auth full focus; Cuma bitiş kriteri kesin |
| Slug çakışması (race condition)                 | Düşük    | Orta       | DB UNIQUE constraint + uygulama seviyesi kontrol              |
| GitHub API rate limit                           | Orta     | Düşük      | Sunucu env `GITHUB_TOKEN` (saatte 5000 istek)                 |
| Public sayfa yavaşlığı                          | Düşük    | Orta       | SSG/ISR + sadece güncellemede revalidate                      |
| Ekip üyesinin Next.js bilmemesi                 | Orta     | Orta       | Sprint 0'da AGENTS.md ve nextjs.org/learn zorunlu             |
| AI asistan eski Next.js bilgisi ile kod üretimi | Yüksek   | Orta       | AGENTS.md uyarısı + `node_modules/next/dist/docs/` okunması   |

### 16.2. Mimari Karar Kaydı

| Karar                      | Alternatif            | Seçim Gerekçesi                                                                                                                 | Trade-off                                                              |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **ORM: Drizzle**           | Prisma                | Neon serverless driver ile doğrudan uyum; küçük bundle boyutu; cold start minimize. Prisma Accelerate ek servis gerektirebilir. | Drizzle API'si Prisma kadar sezgisel değil; bazen SQL bilgisi gerekir. |
| **Auth: iron-session**     | NextAuth v5           | MVP'de sadece email+parola yeterli; NextAuth adapter/provider konfigürasyonu gereksiz karmaşıklık.                              | İleride OAuth eklenirse auth katmanı yeniden yazılmalı.                |
| **Public Render: SSG/ISR** | SSR                   | Portföy sayfaları çok sık değişmez ama çok sık ziyaret edilir; CDN'den sunum performansı yüksek.                                | `revalidatePath` doğru ayarlanmazsa ziyaretçi eski veriyi görebilir.   |
| **Stil: Tailwind v4**      | CSS Modules           | shadcn/ui zaten Tailwind üzerine kurulu; v4 tema sistemi portföy temalarını yönetmeyi kolaylaştırır.                            | v4 henüz yeni; v3'e göre dokümantasyonu daha az olgun.                 |
| **Monolith Yapı**          | Ayrı Frontend/Backend | Aynı projede yönetim; CORS ve tip senkronizasyonu yükü yok.                                                                     | Kullanıcı sayısı ciddi ölçüde artarsa yetersiz kalabilir.              |

---

## 17. İleri Sürüm Yol Haritası (MVP Sonrası)

MVP başarıyla yayına çıktıktan sonra değerlendirilecek özellikler:

1. **Görsel Yükleme:** Vercel Blob ile avatar (2MB) ve project image (4MB) upload.
2. **Drag & Drop Sıralama:** `@dnd-kit/core` ile Project ve Link için `order` alanı.
3. **Daha Fazla Tema:** 5+ tema ve özel tema desteği.
4. **Dinamik OG Image:** `app/[slug]/opengraph-image.tsx` ile sosyal paylaşım görselleri.
5. **Rate Limiting:** Upstash Redis ile auth ve import endpoint'leri için kısıtlama (örn. günlük import 3/gün).
6. **Sentry:** Production hata izleme ve alarm.
7. **Playwright E2E:** Her UC için happy path testi.
8. **Husky + lint-staged:** Pre-commit hook.
9. **KVKK Veri Export:** `GET /api/account/export`.
10. **OAuth:** GitHub Login, Google Login.
11. **SEO:** Sitemap, `robots.ts`, Lighthouse 90+ hedefi.
12. **Erişilebilirlik:** A11y manuel testi, klavye navigasyonu, focus trap, çoklu tarayıcı (Firefox, Edge).

---

## 18. Sözlük (Glossary)

| Terim             | Tanım                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| **BCE**           | Boundary-Control-Entity: Sistemi UI, iş mantığı ve veri modelleri olmak üzere üç katmana ayıran mimari prensip.  |
| **Proof-Based**   | Geliştiricinin yetkinliğini canlı demo ve kaynak kod bağlantıları ile doğrulaması yaklaşımı.                     |
| **SSG**           | Static Site Generation: Sayfaların derleme aşamasında önceden oluşturulması.                                     |
| **ISR**           | Incremental Static Regeneration: Statik sayfaların arka planda belirli aralıklarla veya on-demand güncellenmesi. |
| **ORM**           | Object-Relational Mapping: Drizzle ile veritabanı tablolarının TypeScript tiplerine eşlenmesi.                   |
| **Stateless**     | Sunucunun her isteği bağımsız ele alması; oturum bilgisi sunucu belleğinde tutulmaz.                             |
| **Optimistic UI** | Sunucudan onay gelmeden arayüzün işlemin başarılı olduğu varsayımıyla anında güncellenmesi.                      |
| **Slug**          | Kullanıcıya özel benzersiz bağlantı uzantısı (örn. `app.com/aliakbayrak`).                                       |

---

## 19. Referanslar ve Kaynaklar

1. Noves Team, "Next.js ile Modern Web Geliştirme: Kapsamlı Rehber," Noves Digital, Mayıs 2026. [Çevrimiçi]. Erişilebilir: https://noves.digital/blog/nextjs-rehberi/
2. Drizzle Team, "Drizzle ORM - Getting Started," 2024. [Çevrimiçi]. Erişim: https://orm.drizzle.team/docs/overview
3. C. Hunt, "Event-Driven Microservices?," DZone, Haz. 2022.
4. Next.js Documentation: https://nextjs.org/learn
5. Tailwind CSS v4 Documentation: https://tailwindcss.com/docs
6. shadcn/ui Documentation: https://ui.shadcn.com
7. React Hook Form: https://react-hook-form.com
8. Zod: https://zod.dev

---

> **Bu doküman her sprint retrospektifinde gözden geçirilir ve güncellenir. Son güncelleyen ve tarih her değişiklikte bu bölümün altına not düşülür.**
>
> **v1.0.0 — 2026-05-07:** İlk kapsamlı yaşayan doküman oluşturuldu. Tüm mevcut dokümanlar (SRS, SDD, plan.md, AGENTS.md, design-report-prompt.md) sentezlendi. ORM olarak Drizzle, auth olarak iron-session esas alındı (teknik tasarım dokümanlarına uygun olarak).
