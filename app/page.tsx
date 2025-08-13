import Filters from '@/components/Filters'
import CardAd, { Ad } from '@/components/CardAd'
import { headers } from 'next/headers'
import LostEmail from '@/components/LostEmail'

export const revalidate = 60
type ListResponse = { items: Ad[]; page: number; pageSize: number; total: number }

async function fetchList(searchParams: Record<string, string | string[] | undefined>): Promise<ListResponse> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (!v) continue
    if (Array.isArray(v)) v.forEach(x => qs.append(k, x))
    else qs.set(k, v)
  }
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  try {
    const res = await fetch(`${base}/api/inzeraty?${qs.toString()}`, { next: { revalidate: 60 } })
    if (!res.ok) return { items: [], page: 1, pageSize: 24, total: 0 }
    return await res.json()
  } catch {
    return { items: [], page: 1, pageSize: 24, total: 0 }
  }
}

export default async function Page({ searchParams }: { searchParams: Record<string, any> }) {
  const { items, page, pageSize, total } = await fetchList(searchParams)
  const maxPage = Math.max(1, Math.ceil((total || 0) / (pageSize || 24)))
  const potvrzeno = searchParams?.potvrzeno === '1'

  const qsNoPage = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === 'page' || !v) continue
    if (Array.isArray(v)) v.forEach(x => qsNoPage.append(k, x))
    else qsNoPage.set(k, v)
  }
  const link = (p: number) => `/?${new URLSearchParams([...qsNoPage, ['page', String(p)]])}`

  return (
    <div className="container-p space-y-4">
      <h1 className="text-2xl font-semibold">Inzeráty</h1>
      {potvrzeno && <div className="banner-success">✅ Inzerát byl úspěšně potvrzen a zveřejněn.</div>}

      <Filters />

      <div className="text-sm text-zinc-600">Nalezeno: <b>{total}</b></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((ad) => <CardAd key={ad.id} ad={ad} />)}
        {!items?.length && <div className="text-zinc-600">Zatím žádné inzeráty.</div>}
      </div>

      {maxPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <a className={`btn ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`} href={link(page - 1)}>← Předchozí</a>
          <span className="text-sm text-zinc-600">Strana {page} / {maxPage}</span>
          <a className={`btn ${page >= maxPage ? 'pointer-events-none opacity-50' : ''}`} href={link(page + 1)}>Další →</a>
        </div>
      )}

      {/* Info blok – do budoucna můžeme nahradit veřejnou variantou resend */}
      <LostEmail />
    </div>
  )
}
