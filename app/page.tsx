import Filters from '@/components/Filters'
import CardAd from '@/components/CardAd'

export const revalidate = 60
export const metadata = { title: 'Katalog inzerátů – Seno/Sláma' }

async function loadAds(searchParams: Record<string, string | undefined>) {
  const allowed = ['typ','produkt','kraj','kraj_id','okres','okres_id','rok','cmin','cmax','sort','page']
  const p = new URLSearchParams()
  for (const k of allowed) {
    const v = searchParams[k]
    if (v) p.set(k, v)
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const res = await fetch(`${base}/api/inzeraty?${p.toString()}`, { next: { revalidate: 60 } })
  if (!res.ok) return { items: [] as any[] }
  return res.json()
}

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const sp: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(searchParams)) sp[k] = Array.isArray(v) ? v[0] : v
  const { items = [] } = await loadAds(sp)

  return (
    <div className="container-p py-6 space-y-4">
      <Filters />
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ad: any) => <CardAd key={ad.id} ad={ad} />)}
        </div>
      ) : (
        <div className="card p-6 text-center text-zinc-600">
          Žádné inzeráty neodpovídají filtrům.
        </div>
      )}
    </div>
  )
}
