'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function Filters() {
  const params = useSearchParams()
  const router = useRouter()

  const setParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value) else p.delete(key)
    if (key !== 'sort') p.delete('page')
    router.push('?' + p.toString())
  }, [params, router])

  const get = (k: string) => params.get(k) || ''

  return (
    <div className="card p-4 sticky top-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
        <input className="input" placeholder="Kraj (např. Jihomoravský)" value={get('kraj')} onChange={e=>setParam('kraj', e.target.value)} />
        <input className="input" placeholder="Rok sklizně" value={get('rok')} onChange={e=>setParam('rok', e.target.value)} />
        <select className="select" value={get('sort') || 'newest'} onChange={e=>setParam('sort', e.target.value)}>
          <option value="newest">Řazení: Nejnovější</option>
          <option value="cena_asc">Cena ↑ (jen nabídky)</option>
          <option value="cena_desc">Cena ↓ (jen nabídky)</option>
        </select>
      </div>
    </div>
  )
}