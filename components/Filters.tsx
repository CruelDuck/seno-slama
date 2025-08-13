'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'
import { KRAJE, OKRESY, ROKY_SKLIZNE } from '@/lib/cz'

export default function Filters() {
  const params = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const setParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) { p.set(key, value) } else { p.delete(key) }
    if (key !== 'sort') p.delete('page')
    startTransition(() => {
      router.replace('?' + p.toString())
    })
  }, [params, router])

  const get = (k: string) => params.get(k) || ''
  const kraj = get('kraj') as keyof typeof OKRESY | ''

  const okresOptions = useMemo(() => {
    if (!kraj) return []
    return OKRESY[kraj] || []
  }, [kraj])

  return (
    <div className="card p-4 sticky top-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <select className="select" value={get('typ')} onChange={e=>setParam('typ', e.target.value)}>
          <option value="">Typ: vše</option>
          <option>Nabídka</option>
          <option>Poptávka</option>
        </select>

        <select className="select" value={get('produkt')} onChange={e=>setParam('produkt', e.target.value)}>
          <option value="">Produkt: vše</option>
          <option>Seno</option>
          <option>Sláma</option>
        </select>

        {/* Kraj */}
        <select
          className="select"
          value={kraj}
          onChange={(e)=>{
            // při změně kraje smaž okres
            const p = new URLSearchParams(params.toString())
            const v = e.target.value
            if (v) { p.set('kraj', v) } else { p.delete('kraj') }
            p.delete('okres'); p.delete('page')
            startTransition(()=> router.replace('?' + p.toString()))
          }}
        >
          <option value="">Kraj: vše</option>
          {KRAJE.map(k=> <option key={k} value={k}>{k}</option>)}
        </select>

        {/* Okres závislý na kraji */}
        <select
          className="select"
          value={get('okres')}
          onChange={e=>setParam('okres', e.target.value)}
          disabled={!kraj}
        >
          <option value="">{kraj ? 'Okres: všechny' : 'Vyberte kraj'}</option>
          {okresOptions.map(o=> <option key={o} value={o}>{o}</option>)}
        </select>

        {/* Rok sklizně */}
        <select className="select" value={get('rok')} onChange={e=>setParam('rok', e.target.value)}>
          <option value="">Rok sklizně: všechny</option>
          {ROKY_SKLIZNE.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>

        <select className="select" value={get('sort') || 'newest'} onChange={e=>setParam('sort', e.target.value)}>
          <option value="newest">Řazení: Nejnovější</option>
          <option value="cena_asc">Cena ↑ (jen nabídky)</option>
          <option value="cena_desc">Cena ↓ (jen nabídky)</option>
        </select>
      </div>
      {isPending && <div className="text-xs text-neutral-500 mt-2">Načítám…</div>}
    </div>
  )
}
