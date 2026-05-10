import Link from "next/link"

import { OnboardingModal } from "@/components/dashboard/onboarding-modal"
import { ProfileEditor } from "@/components/dashboard/profile-editor"
import { PublishToggle } from "@/components/dashboard/publish-toggle"
import { ThemeSelector } from "@/components/dashboard/theme-selector"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAuth } from "@/lib/auth"
import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { UserController } from "@/lib/controllers/user-controller"


/**
 * Plan 2.3 — Dashboard ana sayfa.
 * Server component: oturum kullanıcısının profil + portföyünü BCE üzerinden yükler.
 * - Portföy yoksa → OnboardingModal (slug + tema seçimi)
 * - Varsa → 3 kart: Portföyün özeti / Profil editörü / Yönetim (Publish + Theme)
 */
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

  // ─── Mevcut portföy ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Portföyün</CardTitle>
            <p className="text-sm text-muted-foreground">/{portfolio.slug}</p>
          </div>
          <Badge variant={portfolio.isPublished ? "default" : "secondary"}>
            {portfolio.isPublished ? "Yayında" : "Taslak"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Tema:</span> {portfolio.theme}
          </div>
          {portfolio.isPublished && (
            <div>
              <Link
                href={`/${portfolio.slug}`}
                target="_blank"
                className="text-primary underline"
              >
                Public sayfayı görüntüle →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </CardHeader>
        <CardContent>
          <ProfileEditor
            initialProfile={{
              fullName: profile.fullName,
              bio: profile.bio,
              avatarUrl: profile.avatarUrl,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yönetim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PublishToggle
            portfolioId={portfolio.id}
            slug={portfolio.slug}
            initialPublished={portfolio.isPublished}
          />
          <ThemeSelector
            portfolioId={portfolio.id}
            initialTheme={portfolio.theme}
          />
        </CardContent>
      </Card>
    </div>
  )
}
