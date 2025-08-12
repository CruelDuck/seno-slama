import Filters from '@/components/Filters'
import CardAd, { Ad } from '@/components/CardAd'

export const revalidate = 60

async function fetchList(searchParams: Record<string,string | string[] | undefined>) {
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(searchParams)) {
    if (!v) continue
    if (Array.isArray(v)) v.forEach(x=>qs.append(k, x))
    else qs.set(k, v)
  }
  // relativní volání – nevyžaduje NEXT_PUBLIC_SITE_URL
  const res = await fetch('/api/inzeraty?' + qs.toString(), { next: { revalidate: 60 } })
  const data = await res.json()
  return data.items as Ad[]
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