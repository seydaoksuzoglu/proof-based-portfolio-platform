"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Teknik detaylar sadece sunucu loglarına — kullanıcıya gösterilmez
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bir şeyler ters gitti
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya sorun devam
          ederse bizimle iletişime geçin.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Tekrar dene
      </Button>
    </div>
  )
}
