import Link from "next/link"
import {
  ArrowRight,
  Code2,
  Globe,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "ProofPortfolio — Kanıt Temelli Portföy Platformu",
  description:
    "Projelerinizi, teknik yetkinliklerinizi ve sosyal bağlantılarınızı doğrulanabilir kanıtlarla sergileyin. Minimal, hızlı ve güvenilir.",
}

const FEATURES = [
  {
    icon: Shield,
    title: "Kanıt Temelli",
    desc: "Her proje için canlı demo ve kaynak kod bağlantısı — sözde değil, kanıtlı.",
  },
  {
    icon: Zap,
    title: "Hızlı & Güvenilir",
    desc: "SSG/ISR ile CDN'den sunulan portföy sayfaları, anında yükleme.",
  },
  {
    icon: Sparkles,
    title: "Minimal Tasarım",
    desc: "bento.me sadeliğinde, sezgisel form girişleri ve hızlı yapılandırma.",
  },
  {
    icon: Code2,
    title: "GitHub Entegrasyonu",
    desc: "GitHub repo'larınızı tek tıkla içe aktarın, portföyünüzü zenginleştirin.",
  },
  {
    icon: Layers,
    title: "Tema Desteği",
    desc: "Light ve dark tema seçenekleri ile kişiselleştirilmiş portföy.",
  },
  {
    icon: Globe,
    title: "Benzersiz URL",
    desc: "proofportfolio.com/sizin-slug şeklinde paylaşılabilir özel adres.",
  },
] as const

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ─── Navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Code2 className="size-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">
              ProofPortfolio
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Giriş Yap</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Kayıt Ol</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]" />

        <div className="container mx-auto px-4 py-24 text-center md:py-32 lg:py-40">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
            <Sparkles className="mr-2 size-4 text-primary" />
            Kanıt Temelli Portföy Platformu
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Yeteneklerinizi{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Kanıtlarla
            </span>{" "}
            Sergileyin
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Projelerinizi, teknik yetkinliklerinizi ve sosyal bağlantılarınızı
            minimal ve profesyonel bir arayüzde sunun. Canlı demo ve kaynak
            kod bağlantıları ile doğrulanabilir bir dijital profil oluşturun.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="px-8" asChild>
              <Link href="/register">
                Ücretsiz Başla
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8" asChild>
              <Link href="/login">Giriş Yap</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Neden ProofPortfolio?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Modern geliştiriciler için tasarlanmış, kanıt odaklı portföy çözümü.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="size-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────── */}
      <section className="border-t py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Portföyünüzü Oluşturmaya Başlayın
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Birkaç dakika içinde profesyonel portföyünüzü oluşturun ve benzersiz
            URL&apos;iniz ile paylaşın.
          </p>
          <Button size="lg" className="mt-8 px-10" asChild>
            <Link href="/register">
              Hemen Başla
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="size-4" />
            <span>ProofPortfolio © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Kullanım Koşulları
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
