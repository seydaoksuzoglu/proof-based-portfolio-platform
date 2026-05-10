"use client"

import {
  GitFork,
  Globe,
  User,
  Share2,
  ImageIcon,
  Video,
  Link as LinkIconLucide,
  Pencil,
  Trash2,
  ExternalLink,
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
import { EmptyState } from "./empty-state"
import { LinkModal } from "./link-modal"

/**
 * İkon string'ini lucide-react bileşenine eşle.
 * Brand ikonları (github, linkedin vb.) lucide-react'ta olmadığı için
 * anlamsal olarak en yakın genel ikonu kullanıyoruz.
 */
function IconForName({ name }: { name: string | null }) {
  const size = "size-4"
  switch (name) {
    case "github":
      return <GitFork className={size} />
    case "linkedin":
      return <User className={size} />
    case "twitter":
      return <Share2 className={size} />
    case "instagram":
      return <ImageIcon className={size} />
    case "youtube":
      return <Video className={size} />
    case "dribbble":
    case "behance":
      return <Globe className={size} />
    case "medium":
    case "dev-to":
      return <Globe className={size} />
    default:
      return <LinkIconLucide className={size} />
  }
}

interface LinkItem {
  id: string
  title: string
  url: string
  icon: string | null
  createdAt: Date
}

interface LinkListProps {
  initialLinks: LinkItem[]
}

/**
 * Plan 3.5.4 — Bağlantı listesi.
 * Her kartta: ikon, başlık, URL. Edit ve delete butonları.
 * Boş durumda EmptyState gösterir.
 */
export function LinkList({ initialLinks }: LinkListProps) {
  const router = useRouter()
  const [links, setLinks] = useState(initialLinks)
  const [, startTransition] = useTransition()

  async function handleDelete(id: string) {
    const previous = links
    setLinks(links.filter((l) => l.id !== id))

    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Bağlantı silindi")
      startTransition(() => router.refresh())
    } catch {
      setLinks(previous)
      toast.error("Bağlantı silinemedi")
    }
  }

  if (links.length === 0) {
    return (
      <EmptyState
        icon={LinkIconLucide}
        title="Henüz bağlantı yok"
        description="Sosyal medya ve dış bağlantılarınızı ekleyin."
        actionLabel="Bağlantı Ekle"
        onAction={() => {
          document.getElementById("add-link-trigger")?.click()
        }}
      />
    )
  }

  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div
          key={l.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5"
        >
          {/* İkon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <IconForName name={l.icon} />
          </div>

          {/* Bilgi */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{l.title}</p>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="size-3 shrink-0" />
              {l.url}
            </a>
          </div>

          {/* Aksiyonlar */}
          <div className="flex items-center gap-0.5">
            <LinkModal
              initialValues={{
                id: l.id,
                title: l.title,
                url: l.url,
                icon: l.icon ?? "",
              }}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bağlantıyı Sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{l.title}&quot; bağlantısını silmek istediğinize emin
                    misiniz? Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(l.id)}
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
