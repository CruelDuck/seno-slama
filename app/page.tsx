import Filters from '@/components/Filters'
import CardAd, { Ad } from '@/components/CardAd'
import { headers } from 'next/headers'

export const revalidate = 60

type ListResponse = {
  items: Ad[]
  page: number
  pageSize: number
  total: number
}

async function fetchList(searchParams: Record<string, string | string[] | undefined>): Promise<ListResponse> {
  // postavit QS
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (!v) continue
    if (Array.isArray(v)) v.forEach(x => qs.append(k, x))
    else qs.set(k, v)
  }

  // absolutní URL z hlaviček (fallback na env)
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  try {
    const res = await fetch(`${base}/api/inzeraty?${qs.toString()}`, { next: { revalidate: 60 } })
    if (!res.ok) return { items: [], page: 1, pageSize: 24, total: 0 }
    const data = await res.json()
    return {
      items: data.items ?? [],
      page: Number(data.page ?? 1),
      pageSize: Number(data.pageSize ?? 24),
      total: Number(data.total ?? 0),
    }
  } catch {
    return { items: [], page: 1, pageSize: 24, total: 0 }
  }
}

export default async function Page({ searchParams }: { searchParams: Record<string, any> }) {
  const { items, page, pageSize, total } = await fetchList(searchParams)
  const maxPage = Math.max(1, Math.ceil((total || 0) / (pageSize || 24)))

  // připravit QS bez 'page' pro odkazy
  const qsNoPage = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === 'page' || !v) continue
    if (Array.isArray(v)) v.forEach(x => qsNoPage.append(k, x))
    else qsNoPage.set(k, v)
  }
  const link = (p: number) => `/?${new URLSearchParams([...qsNoPage, ['page', String(p)]])}`

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inzeráty</h1>
      <Filters />

      <div className="grid-cards">
        {items?.map((ad) => <CardAd key={ad.id} ad={ad} />)}
        {!items?.length && <div className="text-neutral-600">Zatím žádné inzeráty.</div>}
      </div>

      {maxPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <a className={`btn ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`} href={link(page - 1)}>← Předchozí</a>
          <span className="text-sm text-neutral-600">Strana {page} / {maxPage}</span>
          <a className={`btn ${page >= maxPage ? 'pointer-events-none opacity-50' : ''}`} href={link(page + 1)}>Další →</a>
        </div>
      )}
    </div>
  )
}
