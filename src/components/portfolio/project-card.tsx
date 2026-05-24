/**
 * Plan 4.1.6 — Public portföy proje kartı.
 * Kapak görseli, başlık, açıklama, demo/github bağlantıları.
 * Hover efektleri ve tema-duyarlı stiller.
 */

import { ExternalLink, Code2 } from "lucide-react"

interface ProjectCardProps {
  title: string
  description: string | null
  imageUrl: string | null
  demoUrl: string | null
  githubUrl: string | null
}

export function ProjectCard({
  title,
  description,
  imageUrl,
  demoUrl,
  githubUrl,
}: ProjectCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Cover Image */}
      {imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-[var(--portfolio-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--portfolio-fg)]">
          {title}
        </h3>

        {description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--portfolio-muted-fg)]">
            {description}
          </p>
        )}

        {/* Links */}
        {(demoUrl || githubUrl) && (
          <div className="mt-1 flex items-center gap-3">
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--portfolio-accent)] px-3 py-1.5 text-xs font-medium text-[var(--portfolio-accent-fg)] transition-opacity hover:opacity-80"
              >
                <ExternalLink className="size-3.5" />
                Demo
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--portfolio-border)] px-3 py-1.5 text-xs font-medium text-[var(--portfolio-fg)] transition-colors hover:bg-[var(--portfolio-muted)]"
              >
                <Code2 className="size-3.5" />
                Code
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
