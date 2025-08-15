import '../styles/globals.css'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Analytics } from '@vercel/analytics/react'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://seno-slama.vercel.app'
const YEAR = new Date().getFullYear()

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Seno / Sláma – Katalog inzerátů',
  description: 'Veřejný katalog nabídek a poptávek sena a slámy v ČR.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Seno / Sláma – Katalog inzerátů',
    description: 'Veřejný katalog nabídek a poptávek sena a slámy v ČR.',
    url: '/',
    siteName: 'Seno / Sláma',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
          <div className="container-p py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3" aria-label="Seno / Sláma – domů">
              <Image
                src="/logo.svg"
                alt="Seno / Sláma"
                width={168}
                height={44}
                priority
              />
            </a>
            <nav className="flex items-center gap-2">
              <a className="btn" href="/">Katalog</a>
              <a className="btn btn-primary" href="/pridat">Přidat inzerát</a>
              <a className="btn" href="/admin">Admin</a>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t mt-10">
          <div className="container-p py-6 text-sm text-neutral-600 flex flex-wrap items-center gap-3">
            <span>© {YEAR} Seno / Sláma</span>
            <span className="opacity-40">•</span>
            <a href="/pravidla" className="underline underline-offset-2 hover:opacity-80">
              Zásady inzerce &amp; GDPR
            </a>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  )
}
