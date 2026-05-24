/**
 * Plan 5.4.4 — Kullanım Koşulları (placeholder).
 */

import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kullanım Koşulları — ProofPortfolio",
  description: "ProofPortfolio kullanım koşulları ve hizmet şartları.",
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Kullanım Koşulları
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>
          ProofPortfolio platformunu kullanarak aşağıdaki koşulları kabul etmiş
          sayılırsınız. Lütfen bu koşulları dikkatlice okuyun.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Hizmet Tanımı
        </h2>
        <p>
          ProofPortfolio, yazılım geliştiricilerin projelerini, teknik
          yetkinliklerini ve sosyal bağlantılarını sergileyebilecekleri bir
          portföy platformudur. Platform, kanıt temelli (proof-based) bir
          yaklaşımla doğrulanabilir dijital profiller oluşturmayı sağlar.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Kullanıcı Sorumlulukları
        </h2>
        <p>
          Kullanıcılar, platformda paylaştıkları içeriklerden sorumludur.
          Yanıltıcı, yasadışı veya başkalarının haklarını ihlal eden
          içerikler paylaşılamaz. Hesap güvenliğinden kullanıcı sorumludur.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Fikri Mülkiyet
        </h2>
        <p>
          Kullanıcılar, yükledikleri içeriklerin fikri mülkiyet haklarına sahip
          olduklarını veya gerekli izinlere sahip olduklarını beyan eder.
          ProofPortfolio, kullanıcı içeriklerinin mülkiyetini talep etmez.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Hizmet Değişiklikleri
        </h2>
        <p>
          ProofPortfolio, hizmeti herhangi bir zamanda değiştirme, askıya
          alma veya sonlandırma hakkını saklı tutar. Önemli değişikliklerde
          kullanıcılar bilgilendirilecektir.
        </p>
      </div>

      <div className="mt-12">
        <Link
          href="/"
          className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
        >
          ← Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
