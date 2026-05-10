"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createPortfolioSchema } from "@/lib/validators/portfolio"

// Zod 4 input/output ayrımı: theme'in .default() olması nedeniyle
// input'ta optional, output'ta required. RHF 3-generic API ile ayırıyoruz.
type OnboardingFormInput = z.input<typeof createPortfolioSchema>
type OnboardingFormOutput = z.output<typeof createPortfolioSchema>

const THEMES = [
  {
    id: "minimal-light",
    name: "Minimal Light",
    bg: "bg-white",
    accent: "bg-zinc-300",
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    bg: "bg-zinc-900",
    accent: "bg-zinc-600",
  },
]

type SlugStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "invalid"; message: string }
  | { state: "available" }
  | { state: "taken" }

/**
 * Plan 2.3.1 — İlk girişte gösterilen onboarding modal.
 * - Slug input + 400ms debounced /api/portfolio/check-slug
 * - 2 tema kartı
 * - Submit → POST /api/portfolio → router.refresh (modal otomatik kapanır)
 * - Kapatılamaz (open hardcoded true) — kullanıcı portföy oluşturmadan dashboard'u kullanamaz
 */
export function OnboardingModal() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ state: "idle" })

  const form = useForm<OnboardingFormInput, unknown, OnboardingFormOutput>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      slug: "",
      theme: "minimal-light",
    },
  })

  const slugValue = useWatch({ control: form.control, name: "slug" }) ?? ""
  const themeValue =
    useWatch({ control: form.control, name: "theme" }) ?? "minimal-light"

  // ─── Debounced slug check ─────────────────────────────────
  // Not: slug 3 karakterden kısaysa effect çalışmaz; "idle" durumu
  // aşağıda render zamanında derive edilir (effectiveStatus).
  // Bu, react-hooks/set-state-in-effect kuralını (cascade render) önler.
  useEffect(() => {
    if (!slugValue || slugValue.length < 3) return

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      setSlugStatus({ state: "checking" })
      try {
        const res = await fetch(
          `/api/portfolio/check-slug?slug=${encodeURIComponent(slugValue)}`,
          { signal: controller.signal },
        )
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string
          }
          setSlugStatus({
            state: "invalid",
            message: err.error ?? "Geçersiz slug",
          })
          return
        }
        const data = (await res.json()) as { available: boolean }
        setSlugStatus({ state: data.available ? "available" : "taken" })
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setSlugStatus({ state: "idle" })
      }
    }, 400)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [slugValue])

  // Render zamanında derive edilen durum:
  // - Slug 3 karakterden kısaysa her zaman "idle" göster (kullanıcı silmiş
  //   olabilir; effect bu durumda çalışmıyor, state eski değerinde kalır).
  // - Aksi halde async effect'in set ettiği state geçerli.
  const effectiveStatus: SlugStatus =
    slugValue.length < 3 ? { state: "idle" } : slugStatus

  // ─── Submit ───────────────────────────────────────────────
  async function onSubmit(data: OnboardingFormOutput) {
    if (effectiveStatus.state !== "available") {
      toast.error("Lütfen geçerli ve müsait bir slug seçin")
      return
    }

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? "Portföy oluşturulamadı")
      }
      toast.success("Portföyün oluşturuldu! 🎉")
      // router.refresh → server component yeniden render → portfolio artık var
      // → modal page tarafında render edilmez, otomatik kaybolur
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu")
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Portföyünü oluştur</DialogTitle>
          <DialogDescription>
            Bir kullanıcı adı (slug) seç ve tema belirle. Bu, profilinin
            herkese açık adresi olacak.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">Kullanıcı adı</Label>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                portfolio.com/
              </span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  {...form.register("slug", {
                    setValueAs: (v) =>
                      typeof v === "string" ? v.toLowerCase().trim() : "",
                  })}
                  placeholder="ornek-kullanici"
                  autoComplete="off"
                  autoFocus
                  maxLength={31}
                  className="pr-9"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <SlugStatusIcon status={effectiveStatus} />
                </div>
              </div>
            </div>
            <SlugStatusMessage
              status={effectiveStatus}
              formError={form.formState.errors.slug?.message}
            />
          </div>

          {/* Tema */}
          <div className="space-y-1.5">
            <Label>Tema</Label>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((t) => {
                const isActive = themeValue === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      form.setValue("theme", t.id, { shouldDirty: true })
                    }
                    aria-pressed={isActive}
                    className={cn(
                      "overflow-hidden rounded-lg border-2 text-left transition-all",
                      isActive
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className={cn("aspect-[4/3] space-y-1.5 p-3", t.bg)}>
                      <div className={cn("h-2 w-1/2 rounded", t.accent)} />
                      <div className={cn("h-1.5 w-3/4 rounded", t.accent)} />
                      <div className={cn("h-1.5 w-2/3 rounded", t.accent)} />
                    </div>
                    <div className="flex items-center justify-between border-t bg-background px-3 py-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      {isActive && <Check className="size-4 text-primary" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                isPending ||
                effectiveStatus.state !== "available"
              }
            >
              {form.formState.isSubmitting
                ? "Oluşturuluyor..."
                : "Portföyü oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function SlugStatusIcon({ status }: { status: SlugStatus }) {
  if (status.state === "checking") {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />
  }
  if (status.state === "available") {
    return <Check className="size-4 text-green-600" />
  }
  if (status.state === "taken" || status.state === "invalid") {
    return <X className="size-4 text-destructive" />
  }
  return null
}

function SlugStatusMessage({
  status,
  formError,
}: {
  status: SlugStatus
  formError?: string
}) {
  // Form Zod hatası öncelikli (kullanıcı submit denedi ve schema reddetti)
  if (formError) return <p className="text-xs text-destructive">{formError}</p>

  if (status.state === "checking")
    return <p className="text-xs text-muted-foreground">Kontrol ediliyor...</p>
  if (status.state === "available")
    return <p className="text-xs text-green-600">Bu slug müsait ✓</p>
  if (status.state === "taken")
    return <p className="text-xs text-destructive">Bu slug zaten kullanımda</p>
  if (status.state === "invalid")
    return <p className="text-xs text-destructive">{status.message}</p>
  return (
    <p className="text-xs text-muted-foreground">
      3-31 karakter, küçük harf, rakam ve tire (-)
    </p>
  )
}
