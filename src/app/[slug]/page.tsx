/**
 * Plan 4.1.1 — Public portfolio sayfası.
 * SSG/ISR: revalidate = 60 saniye.
 * PortfolioController.getPublicPortfolio(slug) çağrısı.
 * notFound() ile 404 yönlendirmesi.
 * data-theme attribute ile SSR-safe tema uygulaması (PRD §11.3).
 */

import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

import { PortfolioController } from "@/lib/controllers/portfolio-controller"
import { ProfileCard } from "@/components/portfolio/profile-card"
import { BentoGrid } from "@/components/portfolio/bento-grid"

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const portfolio = await PortfolioController.getPublicPortfolio(slug)
    const title = portfolio.owner.fullName
      ? `${portfolio.owner.fullName} — ProofPortfolio`
      : `${slug} — ProofPortfolio`
    const description = portfolio.owner.bio ?? "Proof-Based Portfolio — Kanıt temelli portföy platformu."

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        url: `/${slug}`,
      },
    }
  } catch {
    return {
      title: "Portfolio — ProofPortfolio",
      description: "Proof-Based Portfolio platformu.",
    }
  }
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { slug } = await params

  let portfolio
  try {
    portfolio = await PortfolioController.getPublicPortfolio(slug)
  } catch {
    notFound()
  }

  const themeClass = portfolio.theme === "minimal-dark" ? "portfolio-dark" : "portfolio-light"

  return (
    <div
      data-theme={portfolio.theme}
      className={`min-h-screen bg-[var(--portfolio-bg)] ${themeClass}`}
    >
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Profile */}
        <header className="mb-16">
          <ProfileCard
            fullName={portfolio.owner.fullName}
            bio={portfolio.owner.bio}
            avatarUrl={portfolio.owner.avatarUrl}
          />
        </header>

        {/* Content */}
        <main>
          <BentoGrid
            projects={portfolio.projects}
            links={portfolio.links}
          />
        </main>

        {/* Footer */}
        <footer className="mt-20 border-t border-[var(--portfolio-border)] pt-8 text-center">
          <p className="text-xs text-[var(--portfolio-muted-fg)]">
            Built with{" "}
            <Link
              href="/"
              className="underline underline-offset-2 transition-colors hover:text-[var(--portfolio-fg)]"
            >
              ProofPortfolio
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
