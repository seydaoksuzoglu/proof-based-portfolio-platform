"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/user"

interface ProfileEditorProps {
  initialProfile: {
    fullName: string | null
    bio: string | null
    avatarUrl: string | null
  }
}

const BIO_MAX = 500
const FULLNAME_MAX = 100

/**
 * Plan 2.3.2 — Profil editörü.
 * RHF + zodResolver(updateProfileSchema). Sadece DEĞİŞEN alanlar PATCH'e gönderilir
 * (isDirty kontrolü) — server idempotent, gereksiz update yok.
 * router.refresh() ile server component yenilenir → page.tsx güncel veriyi çeker.
 */
export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: initialProfile.fullName ?? "",
      bio: initialProfile.bio ?? "",
      avatarUrl: initialProfile.avatarUrl ?? "",
    },
  })

  // useWatch — React Compiler uyumlu (form.watch yerine)
  const bioValue = useWatch({ control: form.control, name: "bio" }) ?? ""
  const bioLen = bioValue.length

  async function onSubmit(data: UpdateProfileInput) {
    // Sadece değişen alanları topla
    const dirty = form.formState.dirtyFields
    const payload: Partial<UpdateProfileInput> = {}
    if (dirty.fullName) payload.fullName = data.fullName
    if (dirty.bio) payload.bio = data.bio
    if (dirty.avatarUrl) payload.avatarUrl = data.avatarUrl

    if (Object.keys(payload).length === 0) {
      toast.info("Değişiklik yok")
      return
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? "Profil güncellenemedi")
      }

      toast.success("Profil güncellendi")
      // dirty state'i sıfırla (buton tekrar disable olur)
      form.reset(data)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Profil güncellenemedi",
      )
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* fullName */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Ad Soyad</Label>
        <Input
          id="fullName"
          {...form.register("fullName")}
          maxLength={FULLNAME_MAX}
          placeholder="Adın ve soyadın"
        />
        {form.formState.errors.fullName && (
          <p className="text-xs text-destructive">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

      {/* bio + karakter sayacı */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...form.register("bio")}
          maxLength={BIO_MAX}
          rows={4}
          placeholder="Kendinden kısaca bahset..."
        />
        <div className="flex items-center justify-between text-xs">
          {form.formState.errors.bio ? (
            <p className="text-destructive">
              {form.formState.errors.bio.message}
            </p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              "text-muted-foreground tabular-nums",
              bioLen > BIO_MAX * 0.9 && "text-amber-600",
              bioLen >= BIO_MAX && "text-destructive",
            )}
          >
            {bioLen} / {BIO_MAX}
          </span>
        </div>
      </div>

      {/* avatarUrl */}
      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          type="url"
          {...form.register("avatarUrl")}
          placeholder="https://..."
        />
        {form.formState.errors.avatarUrl && (
          <p className="text-xs text-destructive">
            {form.formState.errors.avatarUrl.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            form.formState.isSubmitting ||
            isPending ||
            !form.formState.isDirty
          }
        >
          {form.formState.isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}
