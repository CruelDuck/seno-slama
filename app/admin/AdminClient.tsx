'use client'
import { useEffect, useState } from 'react'

export default function AdminClient() {
  const [key, setKey] = useState<string>('')
  const [authed, setAuthed] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const k = localStorage.getItem('admin_key') || ''
    setKey(k)
    if (k) setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    ;(async () => {
      setLoading(true)
      const m = await fetch('/api/admin/metrics', { headers: { 'x-admin-key': key } })
        .then(r=>r.json()).catch(()=>null)
      setMetrics(m)
      const list = await fetch('/api/admin/inzeraty/list', { headers: { 'x-admin-key': key } })
        .then(r=>r.json()).catch(()=>({ items: [] }))
      setItems(list.items || [])
      setLoading(false)
    })()
  }, [authed, key])

  function login(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem('admin_key', key)
    setAuthed(true)
  }

  async function act(id: string, action: 'archive'|'restore') {
    const res = await fetch(`/api/admin/inzeraty/${id}/${action}`, {
      method: 'POST',
      headers: { 'x-admin-key': key }
    })
    if (res.ok) {
      setItems(items => items.map(it => it.id === id ? {
        ...it, status: action === 'archive' ? 'Archivováno' : 'Ověřeno'
      } : it))
    } else {
      alert('Akce selhala')
    }
  }

  async function exportContacts() {
    const res = await fetch('/api/admin/contacts/export', { headers: { 'x-admin-key': key } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kontakty.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className="container py-6 max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <form onSubmit={login} className="space-y-3 card p-4">
          <input className="input" placeholder="PIN" value={key} onChange={e=>setKey(e.target.value)} />
          <button className="btn btn-primary">Přihlásit</button>
        </form>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Admin přehled</h1>
        <button className="btn" onClick={()=>{ localStorage.removeItem('admin_key'); location.reload() }}>Odhlásit</button>
        <button className="btn" onClick={exportContacts}>Export kontaktů (CSV)</button>
      </div>

      {loading && <div>Načítám…</div>}

      {metrics && (
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="card p-3"><div className="text-sm text-neutral-600">Celkem</div><div className="text-2xl font-semibold">{metrics.total}</div></div>
          <div className="card p-3"><div className="text-sm text-neutral-600">Ověřené</div><div className="text-2xl font-semibold">{metrics.verified}</div></div>
          <div className="card p-3"><div className="text-sm text-neutral-600">Archiv</div><div className="text-2xl font-semibold">{metrics.archived}</div></div>
          <div className="card p-3"><div className="text-sm text-neutral-600">Nové (7 dní)</div><div className="text-2xl font-semibold">{metrics.last7}</div></div>
        </div>
      )}

      <div className="card p-4">
        <div className="font-semibold mb-2">Inzeráty</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Název</th>
                <th className="py-2 pr-2">Typ</th>
                <th className="py-2 pr-2">Produkt</th>
                <th className="py-2 pr-2">Kraj/Okres</th>
                <th className="py-2 pr-2">Cena</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Akce</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">
                    <a className="text-blue-700" href={`/inzerat/${it.id}`} target="_blank" rel="noreferrer">{it.nazev}</a>
                  </td>
                  <td className="py-2 pr-2">{it.typ_inzeratu}</td>
                  <td className="py-2 pr-2">{it.produkt}</td>
                  <td className="py-2 pr-2">{it.kraj}{it.okres ? ` / ${it.okres}` : ''}</td>
                  <td className="py-2 pr-2">
                    {typeof it.cena_za_balik === 'number' ? `${it.cena_za_balik.toLocaleString('cs-CZ')} Kč` : '—'}
                  </td>
                  <td className="py-2 pr-2">{it.status}</td>
                  <td className="py-2 pr-2">
                    {it.status !== 'Archivováno'
                      ? <button className="btn" onClick={()=>act(it.id,'archive')}>Archivovat</button>
                      : <button className="btn" onClick={()=>act(it.id,'restore')}>Obnovit</button>}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={7} className="py-4 text-neutral-500">Žádná data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
