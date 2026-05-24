# Proof-Based Portfolio Platform

Yazılım geliştiricilerin projelerini, teknik yetkinliklerini ve sosyal bağlantılarını **kanıt temelli** (proof-based) bir arayüzde sergileyen bir portföy platformu.

## Teknoloji Stack'i

| Katman           | Teknoloji                    |
| ---------------- | ---------------------------- |
| Framework        | Next.js 16 (App Router)      |
| Runtime          | React 19                     |
| Dil              | TypeScript (strict mode)     |
| Veritabanı       | PostgreSQL (Neon serverless) |
| ORM              | Drizzle ORM                  |
| Stil             | Tailwind CSS v4              |
| UI Bileşenleri   | shadcn/ui (Radix UI)         |
| Form Yönetimi    | React Hook Form + Zod        |
| Kimlik Doğrulama | iron-session                 |
| Şifre Hashleme   | bcrypt                       |
| E-posta          | Resend                       |
| Test             | Vitest                       |
| Deployment       | Vercel                       |

## Kurulum

```bash
# Repo'yu klonla
git clone https://github.com/seydaoksuzoglu/proof-based-portfolio-platform.git
cd proof-based-portfolio-platform/src

# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local dosyasını düzenle (aşağıdaki değişkenleri doldur)
```

## Ortam Değişkenleri

| Değişken              | Açıklama                                          | Zorunlu                       |
| --------------------- | ------------------------------------------------- | ----------------------------- |
| `DATABASE_URL`        | Neon PostgreSQL bağlantı URL'si                   | ✅                            |
| `AUTH_SECRET`         | iron-session şifreleme anahtarı (min 32 karakter) | ✅                            |
| `NEXT_PUBLIC_APP_URL` | Uygulama URL'si (ör. `http://localhost:3000`)     | ✅                            |
| `RESEND_API_KEY`      | Resend email API anahtarı                         | Opsiyonel (yoksa konsola log) |
| `EMAIL_FROM`          | Gönderen email adresi                             | Opsiyonel                     |
| `GITHUB_TOKEN`        | GitHub API token (rate limit artırımı)            | Opsiyonel                     |

## Veritabanı

```bash
# Migration oluştur
npm run db:generate

# Migration uygula
npm run db:migrate

# Seed verisi ekle (opsiyonel)
npm run db:seed

# Drizzle Studio
npm run db:studio
```

## Geliştirme

```bash
# Dev server başlat
npm run dev

# Lint
npm run lint

# TypeScript tip kontrolü
npm run typecheck

# Testleri çalıştır
npm run test

# Format
npm run format
```

## API Endpoint Listesi

### Kimlik Doğrulama (Public)

| Method | Endpoint                           | Açıklama                 |
| ------ | ---------------------------------- | ------------------------ |
| `POST` | `/api/auth/register`               | Yeni kullanıcı kaydı     |
| `POST` | `/api/auth/login`                  | Giriş + session cookie   |
| `POST` | `/api/auth/logout`                 | Çıkış + cookie temizleme |
| `POST` | `/api/auth/reset-password/request` | Parola sıfırlama talebi  |
| `POST` | `/api/auth/reset-password/confirm` | Parola sıfırlama onayı   |

### Portföy Yönetimi (Auth Required)

| Method  | Endpoint                             | Açıklama                               |
| ------- | ------------------------------------ | -------------------------------------- |
| `POST`  | `/api/portfolio`                     | Portföy oluşturma (1 kullanıcı = 1)    |
| `PATCH` | `/api/portfolio/[id]`                | Portföy güncelleme (tema, slug, yayın) |
| `GET`   | `/api/portfolio/check-slug?slug=...` | Slug müsaitlik kontrolü (Public)       |
| `GET`   | `/api/portfolio/public/[slug]`       | Public portföy verisi (Public)         |

### Proje Yönetimi (Auth Required)

| Method   | Endpoint                        | Açıklama                           |
| -------- | ------------------------------- | ---------------------------------- |
| `POST`   | `/api/projects`                 | Yeni proje ekleme                  |
| `GET`    | `/api/projects`                 | Kullanıcının projelerini listeleme |
| `PATCH`  | `/api/projects/[id]`            | Proje güncelleme                   |
| `DELETE` | `/api/projects/[id]`            | Proje silme                        |
| `PATCH`  | `/api/projects/[id]/visibility` | Görünürlük toggle                  |

### Bağlantı Yönetimi (Auth Required)

| Method   | Endpoint          | Açıklama               |
| -------- | ----------------- | ---------------------- |
| `POST`   | `/api/links`      | Yeni bağlantı ekleme   |
| `GET`    | `/api/links`      | Bağlantıları listeleme |
| `PATCH`  | `/api/links/[id]` | Bağlantı güncelleme    |
| `DELETE` | `/api/links/[id]` | Bağlantı silme         |

### Diğer (Auth Required)

| Method   | Endpoint             | Açıklama              |
| -------- | -------------------- | --------------------- |
| `PATCH`  | `/api/user/profile`  | Profil güncelleme     |
| `POST`   | `/api/github/import` | GitHub repo import    |
| `DELETE` | `/api/account`       | Hesap silme (cascade) |

## Proje Yapısı

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Reset Password
│   ├── (dashboard)/     # Dashboard, Settings
│   ├── [slug]/          # Public portfolio (SSG/ISR)
│   ├── api/             # Route handlers
│   ├── privacy/         # Gizlilik politikası
│   ├── terms/           # Kullanım koşulları
│   ├── error.tsx        # Global error boundary
│   ├── not-found.tsx    # 404 sayfası
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # shadcn/ui bileşenleri
│   ├── auth/            # Auth form bileşenleri
│   ├── dashboard/       # Dashboard bileşenleri
│   └── portfolio/       # Public view bileşenleri
├── lib/
│   ├── controllers/     # İş mantığı (BCE — Control)
│   ├── db/              # Veritabanı şeması ve singleton
│   ├── validators/      # Zod şemaları
│   ├── auth.ts          # Session helpers
│   ├── email.ts         # Resend wrapper
│   ├── errors.ts        # Custom error sınıfları
│   ├── github.ts        # GitHub API client
│   └── get-icon-for-url.ts  # Otomatik ikon eşleştirme
├── tests/
│   ├── unit/            # Controller birim testleri
│   └── integration/     # API route testleri
└── middleware.ts         # Route protection
```

## Lisans

Bu proje BİL 204 / Yazılım Mühendisliği dersi kapsamında geliştirilmiştir.
