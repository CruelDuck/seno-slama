'use client'
import { useEffect, useState } from 'react'

type Item = {
  id: string
  mnozstvi_baliky: number
  cena_za_balik: number | null
  rok_sklizne: string | null
  popis: string | null
  kontakt_telefon: string
  nazev: string
}

export default function Page() {
  const [token, setToken] = useState<string>('')
  const [sent, setSent] = useState<boolean>(false)
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const t = sp.get('token') || ''
    const s = sp.get('sent') === '1'
    setToken(t); setSent(s)
    if (!t) { setLoading(false); return }
    fetch('/api/inzeraty/edit?token=' + encodeURIComponent(t))
      .then(r=>r.json())
      .then(d=> { if (d?.item) setItem(d.item) })
      .finally(()=> setLoading(false))
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) { alert('Chybí token'); return }
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/inzeraty/edit?token=' + encodeURIComponent(token), { method: 'POST', body: fd })
    const data = await res.json().catch(()=>({}))
    if (!res.ok) { alert('Chyba: ' + (data?.error || res.statusText)); return }
    alert('Uloženo. Děkujeme!')
    location.href = '/'
  }

  if (sent && !token) {
    return (
      <div className="container py-6 space-y-3">
        <div className="banner-success">✉️ Odkaz pro úpravu byl odeslán na váš e-mail.</div>
        <a href="/" className="btn">Zpět na hlavní stránku</a>
      </div>
    )
  }

  if (loading) return <div className="container py-6">Načítám…</div>
  if (!token) return <div className="container py-6">Chybí token.</div>
  if (!item) return <div className="container py-6">Token je neplatný nebo vypršel.</div>

  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Upravit inzerát</h1>
      <div className="text-neutral-600">{item.nazev}</div>
      <form onSubmit={onSubmit} className="card p-4 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Množství (ks)</div>
            <input name="mnozstvi_baliky" type="number" defaultValue={item.mnozstvi_baliky} className="input" required />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Cena za balík (Kč)</div>
            <input name="cena_za_balik" type="number" defaultValue={item.cena_za_balik ?? ''} className="input" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Rok sklizně</div>
            <select name="rok_sklizne" defaultValue={item.rok_sklizne ?? ''} className="select">
              <option value="">—</option>
              <option>2022</option><option>2023</option><option>2024</option><option>2025</option>
            </select>
          </label>
        </div>
        <label className="block">
          <div className="text-sm mb-1">Popis</div>
          <textarea name="popis" className="textarea" rows={6} defaultValue={item.popis ?? ''}></textarea>
        </label>
        <label className="block">
          <div className="text-sm mb-1">Kontakt – Telefon</div>
          <input name="kontakt_telefon" defaultValue={item.kontakt_telefon} className="input" />
        </label>
        <button className="btn btn-primary" type="submit">Uložit změny</button>
      </form>
    </div>
  )
}
