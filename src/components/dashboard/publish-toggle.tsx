"use client"

import { Check, Copy, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PublishToggleProps {
  portfolioId: string
  slug: string
  initialPublished: boolean
}

/**
 * Plan 2.3.4 — Yayın durumu toggle.
 * - Switch ile PATCH /api/portfolio/[id] { isPublished }
 * - Optimistic UI: hata olursa eski değere döner
 * - Yayında ise paylaşılabilir URL + copy-to-clipboard butonu
 * - router.refresh() ile server component (page.tsx) yeniden render edilir →
 *   "Taslak/Yayında" badge'i ve "Public sayfayı görüntüle" linki güncellenir
 */
export function PublishToggle({
  portfolioId,
  slug,
  initialPublished,
}: PublishToggleProps) {
  const router = useRouter()
  const [isPublished, setIsPublished] = useState(initialPublished)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `/${slug}`

  async function handleToggle(next: boolean) {
    const previous = isPublished
    setIsPublished(next) // optimistic

    try {
      const res = await fetch(`/api/portfolio/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      })
      if (!res.ok) throw new Error("Update failed")

      toast.success(next ? "Portföy yayına alındı" : "Portföy yayından kaldırıldı")
      startTransition(() => router.refresh())
    } catch {
      setIsPublished(previous) // rollback
      toast.error("Güncelleme başarısız oldu")
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success("URL kopyalandı")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Kopyalama başarısız")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="publish-switch" className="text-sm font-medium">
            Yayın durumu
          </Label>
          <p className="text-xs text-muted-foreground">
            Açıkken portföyün herkese açık adreste görünür.
          </p>
        </div>
        <Switch
          id="publish-switch"
          checked={isPublished}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>

      {isPublished && (
        <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-2">
          <code className="flex-1 truncate text-xs">{publicUrl}</code>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={copyUrl}
            aria-label="URL'i kopyala"
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            aria-label="Yeni sekmede aç"
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
