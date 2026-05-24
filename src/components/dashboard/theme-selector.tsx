"use client"

import { Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PORTFOLIO_THEMES } from "@/lib/portfolio-themes"

interface ThemeSelectorProps {
  portfolioId: string
  initialTheme: string
}

/**
 * Plan 2.3.3 — Tema seçici.
 * 6 önizleme kartı; seçim → PATCH /api/portfolio/[id] { theme }.
 * Tema listesi @/lib/portfolio-themes'ten gelir (onboarding ile DRY).
 */
export function ThemeSelector({
  portfolioId,
  initialTheme,
}: ThemeSelectorProps) {
  const router = useRouter()
  const [theme, setTheme] = useState(initialTheme)
  const [isPending, startTransition] = useTransition()

  async function handleSelect(next: string) {
    if (next === theme) return

    const previous = theme
    setTheme(next)

    try {
      const res = await fetch(`/api/portfolio/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      })
      if (!res.ok) throw new Error("Update failed")

      toast.success("Tema güncellendi")
      startTransition(() => router.refresh())
    } catch {
      setTheme(previous)
      toast.error("Tema güncellenemedi")
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">Tema</Label>
        <p className="text-xs text-muted-foreground">
          Public sayfanın görünümünü belirler.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PORTFOLIO_THEMES.map((t) => {
          const isActive = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.id)}
              disabled={isPending}
              aria-label={`${t.name} temasını seç`}
              aria-pressed={isActive}
              className={cn(
                "group overflow-hidden rounded-lg border-2 text-left transition-all",
                isActive
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50",
                isPending && "cursor-wait opacity-50",
              )}
            >
              <div className={cn("aspect-[4/3] space-y-1.5 p-3", t.bg)}>
                <div className={cn("h-2 w-1/2 rounded", t.accent)} />
                <div className={cn("h-1.5 w-3/4 rounded", t.accent)} />
                <div className={cn("h-1.5 w-2/3 rounded", t.accent)} />
                <div className="pt-2">
                  <div className={cn("h-6 w-12 rounded", t.accent)} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-background px-3 py-2">
                <span className="truncate text-sm font-medium">{t.name}</span>
                {isActive && <Check className="size-4 shrink-0 text-primary" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
