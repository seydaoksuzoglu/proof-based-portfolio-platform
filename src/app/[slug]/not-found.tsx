/**
 * Plan 4.3.1 — Public 404 sayfası.
 * Slug bulunamadığında veya portföy yayında olmadığında gösterilir.
 */

import Link from "next/link"

export default function PublicPortfolioNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-6xl font-bold tracking-tighter text-foreground">
          404
        </h1>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Portföy bulunamadı
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Bu portföy mevcut değil veya henüz yayınlanmamış olabilir.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  )
}
