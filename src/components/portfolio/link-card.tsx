/**
 * Plan 4.1.7 — Public portföy bağlantı kartı.
 * İkon + başlık + URL; yeni sekmede açılır.
 * Lucide-react brand ikonları içermediği için generic ikonlar kullanılır.
 */

import {
  ExternalLink,
  Code2,
  Globe,
  Link as LinkIcon,
  Pen,
  User,
  Video,
  Image,
  MessageSquare,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  github: Code2,
  linkedin: User,
  twitter: MessageSquare,
  instagram: Image,
  youtube: Video,
  link: LinkIcon,
  codepen: Code2,
  "dev-to": Pen,
  "stack-overflow": Code2,
  dribbble: Pen,
  behance: Pen,
  medium: Pen,
}

interface LinkCardProps {
  title: string
  url: string
  icon: string | null
}

export function LinkCard({ title, url, icon }: LinkCardProps) {
  const IconComponent = ICON_MAP[icon ?? "link"] ?? Globe

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-[var(--portfolio-border)] bg-[var(--portfolio-card)] px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--portfolio-muted)]">
        <IconComponent className="size-5 text-[var(--portfolio-accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--portfolio-fg)]">
          {title}
        </p>
      </div>
      <ExternalLink className="size-4 shrink-0 text-[var(--portfolio-muted-fg)] opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  )
}
