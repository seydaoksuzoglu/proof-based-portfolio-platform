import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-6xl font-bold tracking-tighter">404</h1>
        <h2 className="text-xl font-semibold tracking-tight">
          Sayfa bulunamadı
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  )
}
