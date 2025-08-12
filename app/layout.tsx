import '../styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seno/Sláma – Katalog',
  description: 'Veřejný katalog inzerátů na seno a slámu.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <header className="border-b">
          <div className="container flex items-center justify-between h-14">
            <a href="/" className="font-semibold">Seno/Sláma</a>
            <nav className="flex items-center gap-2">
              <a className="btn" href="/pridat">Přidat inzerát</a>
              <a className="btn" href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
        <footer className="border-t mt-10">
          <div className="container py-6 text-sm text-neutral-600">
            © {new Date().getFullYear()} Seno/Sláma
          </div>
        </footer>
      </body>
    </html>
  )
}