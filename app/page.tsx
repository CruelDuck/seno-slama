import Link from 'next/link'

export const metadata = { title: 'Upravit inzerát', robots: { index: false, follow: true } }

export default function UpravitPage({ searchParams }: { searchParams?: { sent?: string } }) {
  const sent = searchParams?.sent === '1'
  return (
    <div className="container-p max-w-xl py-8">
      <h1 className="text-2xl font-semibold mb-4">Upravit inzerát</h1>

      {sent ? (
        <div className="card p-4 space-y-3">
          <p>Pokud e-mail existuje, poslali jsme vám odkaz na úpravu. Zkontrolujte poštu i spam.</p>
          <Link className="btn" href="/">Zpět na katalog</Link>
        </div>
      ) : (
        <form className="card p-4 space-y-3" method="POST" action="/api/inzeraty/edit">
          <input className="input" name="id" placeholder="ID inzerátu (UUID)" required />
          <input className="input" type="email" name="email" placeholder="E-mail použitý u inzerátu" required />
          <button className="btn btn-primary" type="submit">Poslat odkaz pro úpravu</button>
          <p className="text-xs text-neutral-500">Po odeslání uvidíte potvrzení na této stránce.</p>
        </form>
      )}
    </div>
  )
}
