/**
 * Plan 4.1.5 — Bento grid layout.
 * Proje ve bağlantıları responsive grid'de render eder.
 * isVisible filtrelemesi sunucu tarafında yapılmış olmalı — burada tümü gösterilir.
 */

import { ProjectCard } from "./project-card"
import { LinkCard } from "./link-card"

interface Project {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  demoUrl: string | null
  githubUrl: string | null
}

interface Link {
  id: string
  title: string
  url: string
  icon: string | null
}

interface BentoGridProps {
  projects: Project[]
  links: Link[]
}

export function BentoGrid({ projects, links }: BentoGridProps) {
  const hasContent = projects.length > 0 || links.length > 0

  if (!hasContent) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--portfolio-muted-fg)]">
          Bu portföyde henüz içerik bulunmuyor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Projects Section */}
      {projects.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--portfolio-fg)]">
            Projeler
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                imageUrl={project.imageUrl}
                demoUrl={project.demoUrl}
                githubUrl={project.githubUrl}
              />
            ))}
          </div>
        </section>
      )}

      {/* Links Section */}
      {links.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--portfolio-fg)]">
            Bağlantılar
          </h2>
          <div className="mx-auto grid max-w-xl grid-cols-1 gap-3">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                title={link.title}
                url={link.url}
                icon={link.icon}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
