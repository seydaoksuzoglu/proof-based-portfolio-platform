"use client"

import {
  ExternalLink,
  GitFork,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "./empty-state"
import { ProjectModal } from "./project-modal"


interface ProjectItem {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  demoUrl: string | null
  githubUrl: string | null
  isVisible: boolean
  createdAt: Date
}

interface ProjectListProps {
  initialProjects: ProjectItem[]
}

/**
 * Plan 3.5.3 — Proje grid listesi.
 * Her item'da: edit butonu (ProjectModal açar), visibility toggle (Switch + optimistic UI),
 * delete butonu (AlertDialog onaylı). Boş durumda EmptyState gösterir.
 */
export function ProjectList({ initialProjects }: ProjectListProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [isPending, startTransition] = useTransition()

  // ─── Visibility Toggle (Optimistic) ────────────────────────
  async function handleToggle(id: string) {
    const previous = projects
    setProjects(
      projects.map((p) =>
        p.id === id ? { ...p, isVisible: !p.isVisible } : p,
      ),
    )

    try {
      const res = await fetch(`/api/projects/${id}/visibility`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error()
      startTransition(() => router.refresh())
    } catch {
      setProjects(previous)
      toast.error("Görünürlük güncellenemedi")
    }
  }

  // ─── Delete ────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const previous = projects
    setProjects(projects.filter((p) => p.id !== id))

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Proje silindi")
      startTransition(() => router.refresh())
    } catch {
      setProjects(previous)
      toast.error("Proje silinemedi")
    }
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="Henüz proje yok"
        description="İlk projenizi ekleyerek portföyünüzü zenginleştirin."
        actionLabel="Proje Ekle"
        onAction={() => {
          // ProjectModal'ı tetiklemek için sayfada zaten buton var
          document.getElementById("add-project-trigger")?.click()
        }}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((proj) => (
        <div
          key={proj.id}
          className="group relative rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
        >
          {/* Kapak Görseli */}
          {proj.imageUrl && (
            <div className="mb-3 aspect-video overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proj.imageUrl}
                alt={proj.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Başlık + Görünürlük */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold">{proj.title}</h4>
              {proj.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {proj.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {proj.isVisible ? (
                <Eye className="size-3.5" />
              ) : (
                <EyeOff className="size-3.5" />
              )}
              <Switch
                checked={proj.isVisible}
                onCheckedChange={() => handleToggle(proj.id)}
                disabled={isPending}
                aria-label="Görünürlük"
                className="scale-75"
              />
            </div>
          </div>

          {/* Linkler */}
          {(proj.demoUrl || proj.githubUrl) && (
            <div className="mt-2 flex gap-2">
              {proj.demoUrl && (
                <a
                  href={proj.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="size-3" />
                  Demo
                </a>
              )}
              {proj.githubUrl && (
                <a
                  href={proj.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <GitFork className="size-3" />
                  GitHub
                </a>
              )}
            </div>
          )}

          {/* Aksiyonlar */}
          <div className="mt-3 flex items-center gap-1 border-t pt-3">
            <ProjectModal
              initialValues={{
                id: proj.id,
                title: proj.title,
                description: proj.description ?? "",
                demoUrl: proj.demoUrl ?? "",
                githubUrl: proj.githubUrl ?? "",
                imageUrl: proj.imageUrl ?? "",
              }}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Pencil className="mr-1 size-3.5" />
                  Düzenle
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 size-3.5" />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Projeyi Sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{proj.title}&quot; projesini silmek istediğinize emin
                    misiniz? Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(proj.id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  )
}
