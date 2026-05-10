import Link from "next/link"
import { redirect } from "next/navigation"

import { LogoutButton } from "@/components/dashboard/logout-button"
import { getSession } from "@/lib/auth"

/**
 * Plan 2.3.5 — Dashboard layout.
 * Middleware /dashboard/:path*'i zaten korur; yine de session.userId
 * boşsa explicit redirect (defansif).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.userId) redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-semibold">
            ProofPortfolio
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
