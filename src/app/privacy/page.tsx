/**
 * Plan 5.4.4 — Gizlilik Politikası (placeholder).
 */

import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gizlilik Politikası — ProofPortfolio",
  description: "ProofPortfolio gizlilik politikası ve veri koruma bilgileri.",
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Gizlilik Politikası
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>
          ProofPortfolio olarak kullanıcılarımızın gizliliğine önem veriyoruz.
          Bu politika, platformumuz üzerinden toplanan kişisel verilerin nasıl
          işlendiğini, korunduğunu ve paylaşıldığını açıklamaktadır.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Toplanan Veriler
        </h2>
        <p>
          Kayıt sırasında email adresi, ad-soyad ve parola (hash&apos;lenmiş
          olarak) toplanır. Portföy oluşturma sürecinde kullanıcının girdiği
          biyografi, avatar URL&apos;si, proje bilgileri ve sosyal medya
          bağlantıları saklanır.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Veri Güvenliği
        </h2>
        <p>
          Parolalar bcrypt algoritması ile hash&apos;lenir ve düz metin olarak
          asla saklanmaz. Oturum yönetimi şifreli cookie (iron-session) ile
          sağlanır. Tüm iletişim HTTPS üzerinden gerçekleşir.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Hesap Silme
        </h2>
        <p>
          Kullanıcılar istedikleri zaman hesaplarını silebilir. Hesap
          silindiğinde portföy, projeler ve bağlantılar dahil tüm veriler
          kalıcı olarak kaldırılır.
        </p>

        <h2 className="text-xl font-semibold text-foreground">İletişim</h2>
        <p>
          Gizlilik ile ilgili sorularınız için lütfen bizimle iletişime geçin.
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
