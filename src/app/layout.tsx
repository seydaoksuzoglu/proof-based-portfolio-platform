import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "ProofPortfolio — Kanıt Temelli Portföy Platformu",
    template: "%s | ProofPortfolio",
  },
  description:
    "Projelerinizi, teknik yetkinliklerinizi ve sosyal bağlantılarınızı doğrulanabilir kanıtlarla sergileyin.",
  openGraph: {
    type: "website",
    siteName: "ProofPortfolio",
    title: "ProofPortfolio — Kanıt Temelli Portföy Platformu",
    description:
      "Projelerinizi, teknik yetkinliklerinizi ve sosyal bağlantılarınızı doğrulanabilir kanıtlarla sergileyin.",
  },
}

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
