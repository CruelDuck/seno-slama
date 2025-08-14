'use client'

import { useEffect, useState } from 'react'

type Ad = {
  id: string
  nazev: string
  produkt: 'Seno'|'Sláma'
  typ_inzeratu: 'Nabídka'|'Poptávka'
  mnozstvi_baliky: number
  cena_za_balik?: number | null
  rok_sklizne?: string | null
  popis?: string | null
  kontakt_jmeno: string
  kontakt_telefon: string
  kontakt_email: string
}

export default function EditClient({ token }: { token: string }) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ok = true
    setLoading(true)
    fetch('/api/inzeraty/edit?token=' + encodeURIComponent(token))
      .then(r => r.json())
      .then(j => { if (!ok) return; if (j?.ad) setAd(j.ad); else setError(j?.error || 'Neplatný nebo expirovaný odkaz.') })
      .catch(() => setError('Chyba načítání.'))
      .finally(() => setLoading(false))
    return () => { ok = false }
  }, [token])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ad) return
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())
    const res = await fetch('/api/inzeraty/edit?token=' + encodeURIComponent(token), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const j = await res.json().catch(()=>({}))
    setSaving(false)
    if (!res.ok) { alert(j?.error || 'Uložení selhalo'); return }
    alert('Uloženo.')
  }

  async function archive() {
    if (!confirm('Opravdu archivovat inzerát?')) return
    const res = await fetch('/api/inzeraty/edit/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { alert(j?.error || 'Akce selhala'); return }
    alert('Archivováno.')
  }

  async function extend() {
    const res = await fetch('/api/inzeraty/edit/extend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { alert(j?.error || 'Akce selhala'); return }
    alert('Prodlouženo o 30 dní.')
  }

  if (loading) return <div className="card p-4">Načítám…</div>
  if (error) return <div className="card p-4 text-red-700">{error}</div>
  if (!ad) return null

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div className="text-sm text-neutral-600">ID: <b>{ad.id}</b></div>

      <div>
        <div className="label">Název</div>
        <input className="input" name="nazev" defaultValue={ad.nazev} required />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="label">Množství (ks)</div>
          <input className="input" name="mnozstvi_baliky" type="number" min={1} defaultValue={ad.mnozstvi_baliky} required />
        </div>
        <div>
          <div className="label">Cena za balík (Kč)</div>
          <input className="input" name="cena_za_balik" type="number" min={0} defaultValue={ad.cena_za_balik ?? ''} />
        </div>
        <div>
          <div className="label">Rok sklizně</div>
          <select className="select" name="rok_sklizne" defaultValue={ad.rok_sklizne ?? ''}>
            <option value="">—</option>
            {['2022','2023','2024','2025'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="label">Telefon</div>
        <input className="input" name="kontakt_telefon" defaultValue={ad.kontakt_telefon} />
      </div>

      <div>
        <div className="label">Popis</div>
        <textarea className="textarea" name="popis" rows={5} defaultValue={ad.popis ?? ''} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Ukládám…' : 'Uložit změny'}</button>
        <button type="button" className="btn" onClick={extend}>Prodloužit o 30 dní</button>
        <button type="button" className="btn" onClick={archive}>Archivovat</button>
        <a href={`/inzerat/${ad.id}`} className="btn" target="_blank" rel="noreferrer">Zobrazit detail</a>
      </div>
    </form>
  )
}
