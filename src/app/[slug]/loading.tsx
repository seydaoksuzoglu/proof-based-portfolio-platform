/**
 * Plan 5.3.1 — Public portföy sayfası için loading skeleton.
 * Next.js Suspense boundary: page.tsx server component'i veri çekerken render olur.
 * Yapı page.tsx ile birebir aynı; gerçek içerik yerine skeleton placeholder'lar.
 */

import { Skeleton } from "@/components/ui/skeleton"

export default function PublicPortfolioLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ─── Profile (ProfileCard placeholder) ─── */}
        <header className="mb-16 flex flex-col items-center gap-5 text-center">
          {/* Avatar */}
          <Skeleton className="h-28 w-28 rounded-full md:h-36 md:w-36" />

          {/* Name + bio */}
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-9 w-56 md:h-10 md:w-72" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </header>

        {/* ─── Projects section ─── */}
        <section className="mb-12 space-y-6">
          <Skeleton className="h-6 w-28" /> {/* "Projeler" başlığı */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* ─── Links section ─── */}
        <section className="space-y-6">
          <Skeleton className="h-6 w-32" /> {/* "Bağlantılar" başlığı */}
          <div className="mx-auto grid max-w-xl grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LinkCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Footer placeholder */}
        <footer className="mt-20 border-t pt-8 text-center">
          <Skeleton className="mx-auto h-3 w-40" />
        </footer>
      </div>
    </div>
  )
}

function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Kapak görseli (16:9) */}
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-5 w-3/4" /> {/* Başlık */}
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
        <div className="mt-1 flex gap-3">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function LinkCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
