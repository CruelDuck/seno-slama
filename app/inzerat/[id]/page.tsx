import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'

async function loadAd(id: string) {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  const res = await fetch(`${base}/api/inzeraty/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  const { item } = await res.json()
  return item as any
}

export default async function Page({ params }: { params: { id: string } }) {
  const ad = await loadAd(params.id)
  if (!ad) return <div className="container py-6">Inzerát nebyl nalezen.</div>

  const first = ad.fotky?.[0]
  const price = typeof ad.cena_za_balik === 'number' ? `${ad.cena_za_balik.toLocaleString('cs-CZ')} Kč/ks` : '—'

  return (
    <div className="container py-6 space-y-4">
      <Link className="text-sm text-blue-700" href="/">← Zpět na katalog</Link>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative aspect-[16/9] bg-neutral-100 rounded-lg overflow-hidden">
          {first?.signedUrl && <Image src={first.signedUrl} alt={ad.nazev} fill className="object-cover" />}
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{ad.nazev}</h1>
          <div className="text-sm text-neutral-600">
            {ad.typ_inzeratu} • {ad.produkt} • {ad.kraj}{ad.okres ? ` • ${ad.okres}` : ''}{ad.rok_sklizne ? ` • ${ad.rok_sklizne}` : ''}
          </div>
          <div className="text-lg font-semibold">Cena: {price}</div>
          <div className="prose max-w-none whitespace-pre-wrap">{ad.popis || '—'}</div>

          <div className="p-3 bg-neutral-50 rounded border">
            <div><b>Kontakt:</b> {ad.kontakt_jmeno}</div>
            <div>{ad.kontakt_telefon}</div>
            <div>{ad.kontakt_email}</div>
          </div>

          <form action={`/api/inzeraty/${ad.id}/request-edit`} method="POST" className="space-y-2">
            <div className="text-sm">Chcete upravit tento inzerát? Zadejte e-mail použitý při vložení a pošleme odkaz.</div>
            <input name="email" type="email" required className="input" placeholder="váš e-mail" />
            <button className="btn btn-primary" type="submit">Poslat odkaz na úpravu</button>
          </form>
        </div>
      </div>
    </div>
  )
}
