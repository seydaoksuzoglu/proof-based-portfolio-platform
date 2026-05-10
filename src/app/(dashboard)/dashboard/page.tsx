import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { LinkList } from "@/components/dashboard/link-list"
import { LinkModal } from "@/components/dashboard/link-modal"
import { OnboardingModal } from "@/components/dashboard/onboarding-modal"
import { ProfileEditor } from "@/components/dashboard/profile-editor"
import { ProjectList } from "@/components/dashboard/project-list"
import { ProjectModal } from "@/components/dashboard/project-modal"
import { PublishToggle } from "@/components/dashboard/publish-toggle"
import { ThemeSelector } from "@/components/dashboard/theme-selector"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/auth"
import { LinkController } from "@/lib/controllers/link-controller"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { ProjectController } from "@/lib/controllers/project-controller"
import { UserController } from "@/lib/controllers/user-controller"

export default async function DashboardPage() {
  const session = await requireAuth()

  const [profile, portfolio] = await Promise.all([
    UserController.getProfile(session.userId),
    PortfolioController.getByUserId(session.userId),
  ])

  // ─── Onboarding (portföy yok) ──────────────────────────────────
  if (!portfolio) {
    return (
      <>
        <Card className="max-w-xl opacity-50">
          <CardHeader>
            <CardTitle>
              Hoş geldin, {profile.fullName ?? profile.email}!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Devam etmek için lütfen portföyünü oluştur.
          </CardContent>
        </Card>
        <OnboardingModal />
      </>
    )
  }

  // ─── İçerikleri paralel yükle ──────────────────────────────────
  const [projects, links] = await Promise.all([
    ProjectController.getProjectsByUser(session.userId),
    LinkController.getLinksByUser(session.userId),
  ])

  // ─── Mevcut portföy ────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Hero Section */}
      <div className="relative mt-4 mb-32">
        {/* Cover Image Placeholder */}
        <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-100 via-indigo-50 to-purple-100 shadow-sm md:h-64">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/cover-placeholder.jpg')" }}
          />
        </div>

        {/* Overlapping Avatar & Basic Info */}
        <div className="absolute -bottom-20 left-8 flex items-end gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-sm md:h-32 md:w-32">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground md:text-5xl">
                {profile.fullName?.charAt(0) ||
                  profile.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {profile.fullName || profile.email}
            </h1>
            <p className="font-medium text-muted-foreground">
              /{portfolio.slug}
            </p>
          </div>
        </div>

        {/* Action buttons (Public View) */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Badge
            variant={portfolio.isPublished ? "default" : "secondary"}
            className="shadow-sm"
          >
            {portfolio.isPublished ? "Yayında" : "Taslak"}
          </Badge>
          {portfolio.isPublished && (
            <a
              href={`/${portfolio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-md bg-background/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              Görüntüle
              <ExternalLink className="ml-2 size-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column (Main: About + Projects) */}
        <div className="space-y-8 md:col-span-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-semibold tracking-tight">Hakkımda</h2>
            </div>
            <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <ProfileEditor
                initialProfile={{
                  fullName: profile.fullName,
                  bio: profile.bio,
                  avatarUrl: profile.avatarUrl,
                }}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-semibold tracking-tight">Projeler</h2>
              <ProjectModal buttonId="add-project-trigger" />
            </div>
            <ProjectList
              key={projects.map((p) => p.id).join()}
              initialProjects={projects}
            />
          </section>
        </div>

        {/* Right Column (Sidebar: Links + Management) */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-semibold tracking-tight">
                Bağlantılar
              </h2>
              <LinkModal buttonId="add-link-trigger" />
            </div>
            <LinkList
              key={links.map((l) => l.id).join()}
              initialLinks={links}
            />
          </section>

          <section className="space-y-4">
            <div className="px-1">
              <h2 className="text-xl font-semibold tracking-tight">Yönetim</h2>
            </div>
            <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <PublishToggle
                portfolioId={portfolio.id}
                slug={portfolio.slug}
                initialPublished={portfolio.isPublished}
              />
              <ThemeSelector
                portfolioId={portfolio.id}
                initialTheme={portfolio.theme}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
