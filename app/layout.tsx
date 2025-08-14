import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Seno/Sláma – Katalog inzerátů',
  description: 'Nabídka a poptávka sena a slámy v ČR.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <header className="border-b bg-white/70 backdrop-blur">
          <div className="container-p py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Seno/Sláma" width={120} height={32} />
            </a>
            <nav className="flex items-center gap-2">
              <a className="btn" href="/">Katalog</a>
              <a className="btn btn-primary" href="/pridat">Přidat inzerát</a>
              <a className="btn" href="/admin">Admin</a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t mt-10">
          <div className="container-p py-6 text-sm text-neutral-600">
            © {new Date().getFullYear()} Seno/Sláma · <a href="/pravidla" className="underline">Zásady inzerce</a>
          </div>
        </footer>

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
