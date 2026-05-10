"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
import { projectSchema, type ProjectInput } from "@/lib/validators/project"
import { Plus, Pencil } from "lucide-react"

interface ProjectModalProps {
  /** undefined ise "create" modu; dolu ise "edit" modu */
  initialValues?: ProjectInput & { id: string }
  /** Dışarıdan trigger butonu vermek için (opsiyonel) */
  trigger?: React.ReactNode
  /** EmptyState'ten erişim için buton ID'si */
  buttonId?: string
}

/**
 * Plan 3.5.1 — Proje ekleme/düzenleme modalı.
 * shadcn Dialog; create/edit birleşik (initialValues prop ile).
 * RHF + zodResolver(projectSchema).
 */
export function ProjectModal({ initialValues, trigger, buttonId }: ProjectModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = !!initialValues

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      demoUrl: initialValues?.demoUrl ?? "",
      githubUrl: initialValues?.githubUrl ?? "",
      imageUrl: initialValues?.imageUrl ?? "",
    },
  })

  async function onSubmit(data: ProjectInput) {
    try {
      const url = isEdit
        ? `/api/projects/${initialValues.id}`
        : "/api/projects"
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

      toast.success(isEdit ? "Proje güncellendi" : "Proje oluşturuldu")
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
            {isEdit ? "Düzenle" : "Proje Ekle"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Projeyi Düzenle" : "Yeni Proje Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Proje bilgilerini güncelleyin."
              : "Portföyünüze yeni bir proje ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-title">Başlık *</Label>
            <Input
              id="proj-title"
              {...form.register("title")}
              placeholder="E-Ticaret Platformu"
              maxLength={100}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Açıklama</Label>
            <Textarea
              id="proj-desc"
              {...form.register("description")}
              placeholder="Projenizi kısaca tanıtın..."
              rows={3}
              maxLength={1000}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Demo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-demo">Demo URL</Label>
            <Input
              id="proj-demo"
              type="url"
              {...form.register("demoUrl")}
              placeholder="https://demo.example.com"
            />
            {form.formState.errors.demoUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.demoUrl.message}
              </p>
            )}
          </div>

          {/* GitHub URL */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-github">GitHub URL</Label>
            <Input
              id="proj-github"
              type="url"
              {...form.register("githubUrl")}
              placeholder="https://github.com/user/repo"
            />
            {form.formState.errors.githubUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.githubUrl.message}
              </p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-image">Görsel URL</Label>
            <Input
              id="proj-image"
              type="url"
              {...form.register("imageUrl")}
              placeholder="https://images.example.com/cover.jpg"
            />
            {form.formState.errors.imageUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.imageUrl.message}
              </p>
            )}
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
