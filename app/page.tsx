import Filters from '@/components/Filters'
import CardAd, { Ad } from '@/components/CardAd'
import { headers } from 'next/headers'

export const revalidate = 60

async function fetchList(searchParams: Record<string,string | string[] | undefined>) {
  // slož query string
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(searchParams)) {
    if (!v) continue
    if (Array.isArray(v)) v.forEach(x=>qs.append(k, x))
    else qs.set(k, v)
  }

  // zjisti absolutní base URL z hlaviček (fallback na env)
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base =
    host ? `${proto}://${host}`
         : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  // bezpečné volání API – nikdy neshodí stránku
  try {
    const res = await fetch(`${base}/api/inzeraty?` + qs.toString(), {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json().catch(() => ({ items: [] }))
    return (data.items || []) as Ad[]
  } catch {
    return []
  }
}

export default async function Page({ searchParams }: { searchParams: Record<string, any> }) {
  const items = await fetchList(searchParams)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inzeráty</h1>
      <Filters />
      <div className="grid-cards">
        {items?.map((ad)=> <CardAd key={ad.id} ad={ad} />)}
        {!items?.length && <div className="text-neutral-600">Zatím žádné inzeráty.</div>}
      </div>
    </div>
  )
}