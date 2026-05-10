"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { linkSchema, type LinkInput } from "@/lib/validators/link"
import { Plus, Pencil } from "lucide-react"

/** Client-side icon preview — getIconForUrl mantığının basitleştirilmiş hali */
function previewIcon(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    const map: Record<string, string> = {
      "github.com": "github",
      "www.github.com": "github",
      "linkedin.com": "linkedin",
      "www.linkedin.com": "linkedin",
      "twitter.com": "twitter",
      "x.com": "twitter",
      "instagram.com": "instagram",
      "www.instagram.com": "instagram",
      "youtube.com": "youtube",
      "www.youtube.com": "youtube",
    }
    return map[hostname] ?? "link"
  } catch {
    return "link"
  }
}

interface LinkModalProps {
  initialValues?: LinkInput & { id: string }
  trigger?: React.ReactNode
  /** EmptyState'ten erişim için buton ID'si */
  buttonId?: string
}

/**
 * Plan 3.5.2 — Bağlantı ekleme/düzenleme modalı.
 * URL girilince ikon otomatik dolar (preview). Server'da getIconForUrl ile doğrulanır.
 */
export function LinkModal({ initialValues, trigger, buttonId }: LinkModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = !!initialValues

  const form = useForm<LinkInput>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      url: initialValues?.url ?? "",
      icon: initialValues?.icon ?? "",
    },
  })

  const urlValue = useWatch({ control: form.control, name: "url" }) ?? ""

  // URL'den ikon preview'ı türet — derived state (useEffect yerine useMemo)
  const iconPreview = useMemo(() => {
    if (urlValue && urlValue.startsWith("https://")) {
      return previewIcon(urlValue)
    }
    return initialValues?.icon ?? "link"
  }, [urlValue, initialValues?.icon])

  async function onSubmit(data: LinkInput) {
    try {
      const url = isEdit ? `/api/links/${initialValues.id}` : "/api/links"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? "İşlem başarısız")
      }

      toast.success(isEdit ? "Bağlantı güncellendi" : "Bağlantı oluşturuldu")
      setOpen(false)
      form.reset()
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" id={buttonId}>
            {isEdit ? (
              <Pencil className="mr-1.5 size-4" />
            ) : (
              <Plus className="mr-1.5 size-4" />
            )}
            {isEdit ? "Düzenle" : "Bağlantı Ekle"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Bağlantıyı Düzenle" : "Yeni Bağlantı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Bağlantı bilgilerini güncelleyin."
              : "Portföyünüze sosyal medya veya dış bağlantı ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="link-title">Başlık *</Label>
            <Input
              id="link-title"
              {...form.register("title")}
              placeholder="LinkedIn"
              maxLength={50}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL *</Label>
            <Input
              id="link-url"
              type="url"
              {...form.register("url")}
              placeholder="https://linkedin.com/in/username"
            />
            {form.formState.errors.url && (
              <p className="text-xs text-destructive">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          {/* Icon Preview */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Otomatik ikon:</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {iconPreview}
            </code>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isPending}
            >
              {form.formState.isSubmitting
                ? "Kaydediliyor..."
                : isEdit
                  ? "Güncelle"
                  : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
