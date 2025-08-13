'use client'
import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

export default function AdminClient() {
  const [key, setKey] = useState<string>(''); const [authed, setAuthed] = useState(false)
  const [metrics, setMetrics] = useState<any>(null); const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<any>(null)

  useEffect(()=>{ const k = localStorage.getItem('admin_key') || ''; setKey(k); if (k) setAuthed(true) }, [])

  useEffect(() => {
    if (!authed) return
    ;(async () => {
      setLoading(true)
      const m = await fetch('/api/admin/metrics', { headers: { 'x-admin-key': key } }).then(r=>r.json()).catch(()=>null)
      setMetrics(m)
      const list = await fetch('/api/admin/inzeraty/list', { headers: { 'x-admin-key': key } }).then(r=>r.json()).catch(()=>({ items: [] }))
      setItems(list.items || [])
      const st = await fetch(`/api/admin/stats?days=${days}`, { headers: { 'x-admin-key': key } }).then(r=>r.json()).catch(()=>null)
      setStats(st)
      setLoading(false)
    })()
  }, [authed, key, days])

  function login(e: React.FormEvent){ e.preventDefault(); localStorage.setItem('admin_key', key); setAuthed(true) }

  async function act(id: string, action: 'archive'|'restore') {
    const res = await fetch(`/api/admin/inzeraty/${id}/${action}`, { method:'POST', headers:{ 'x-admin-key': key } })
    if (res.ok) setItems(items => items.map(it => it.id === id ? { ...it, status: action==='archive' ? 'Archivováno' : 'Ověřeno' } : it))
    else alert('Akce selhala')
  }

  async function resend(id: string) {
    const r = await fetch(`/api/inzeraty/resend?id=${id}`, { method:'POST', headers:{ 'x-admin-key': key } })
    const j = await r.json().catch(()=>({}))
    if (!r.ok) { alert('Resend selhal'); return }
    alert(j?.emailSent ? 'E-mail odeslán.' : 'E-mail neodeslán.')
  }

  if (!authed) {
    return (
      <div className="container-p py-6 max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <form onSubmit={login} className="space-y-3 card p-4">
          <input className="input" placeholder="PIN" value={key} onChange={e=>setKey(e.target.value)} />
          <button className="btn btn-primary">Přihlásit</button>
        </form>
      </div>
    )
  }

  const barData = useMemo(()=> {
    if (!stats?.byKraj) return []
    return Object.entries(stats.byKraj).map(([name, value]) => ({ name, value }))
  }, [stats])
  const lineData = useMemo(()=> {
    if (!stats?.trend) return []
    return Object.entries(stats.trend).sort(([a],[b])=>a.localeCompare(b)).map(([name, value]) => ({ name, value }))
  }, [stats])

  return (
    <div className="container-p py-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Admin přehled</h1>
        <button className="btn" onClick={()=>{ localStorage.removeItem('admin_key'); location.reload() }}>Odhlásit</button>
        <a className="btn" href="/admin">Obnovit data</a>
      </div>

      {loading && <div>Načítám…</div>}

      {metrics && (
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="card p-3"><div className="text-sm text-zinc-600">Celkem</div><div className="text-2xl font-semibold">{metrics.total}</div></div>
          <div className="card p-3"><div className="text-sm text-zinc-600">Ověřené</div><div className="text-2xl font-semibold">{metrics.verified}</div></div>
          <div className="card p-3"><div className="text-sm text-zinc-600">Archiv</div><div className="text-2xl font-semibold">{metrics.archived}</div></div>
          <div className="card p-3"><div className="text-sm text-zinc-600">Nové (7 dní)</div><div className="text-2xl font-semibold">{metrics.last7}</div></div>
        </div>
      )}

      {/* Grafy */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="font-semibold">Statistiky</div>
          <select className="select w-40" value={days} onChange={e=>setDays(Number(e.target.value))}>
            <option value={7}>7 dní</option>
            <option value={30}>30 dní</option>
            <option value={90}>90 dní</option>
          </select>
          {stats && <div className="text-sm text-zinc-600 ml-auto">
            Průměr: {stats.mean ?? '—'} Kč • Medián: {stats.median ?? '—'} Kč (jen Nabídky)
          </div>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
                  <td className="py-2 pr-2"><a className="text-blue-700" href={`/inzerat/${it.id}`} target="_blank" rel="noreferrer">{it.nazev}</a></td>
                  <td className="py-2 pr-2">{it.typ_inzeratu}</td>
                  <td className="py-2 pr-2">{it.produkt}</td>
                  <td className="py-2 pr-2">{it.kraj}{it.okres ? ` / ${it.okres}` : ''}</td>
                  <td className="py-2 pr-2">{typeof it.cena_za_balik === 'number' ? `${it.cena_za_balik.toLocaleString('cs-CZ')} Kč` : '—'}</td>
                  <td className="py-2 pr-2">{it.status}</td>
                  <td className="py-2 pr-2 flex gap-2">
                    {it.status === 'Nové' && <button className="btn" onClick={()=>resend(it.id)}>Poslat potvrzení</button>}
                    {it.status !== 'Archivováno'
                      ? <button className="btn" onClick={()=>act(it.id,'archive')}>Archivovat</button>
                      : <button className="btn" onClick={()=>act(it.id,'restore')}>Obnovit</button>}
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={7} className="py-4 text-zinc-500">Žádná data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
