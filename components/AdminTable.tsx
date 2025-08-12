'use client'
import { useEffect, useState } from 'react'

type Item = any

export default function AdminTable() {
  const [key, setKey] = useState<string>('')
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string| null>(null)

  useEffect(()=>{
    const k = localStorage.getItem('ADMIN_KEY') || ''
    setKey(k)
  }, [])

  async function load(k = key) {
    setError(null)
    setItems(null)
    const res = await fetch('/api/admin/inzeraty/list', { headers: { 'x-admin-key': k }})
    if (!res.ok) {
      setError('Unauthorized nebo jiná chyba.')
      return
    }
    const data = await res.json()
    setItems(data.items || [])
  }

  async function act(id: string, action: 'archive'|'restore') {
    const res = await fetch(`/api/admin/inzeraty/${id}/${action}`, { method: 'POST', headers: { 'x-admin-key': key }})
    if (res.ok) load()
    else alert('Akce selhala')
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex items-center gap-2">
        <input className="input" placeholder="Zadej ADMIN_PASSWORD" value={key} onChange={e=>setKey(e.target.value)} />
        <button className="btn btn-primary" onClick={()=>{ localStorage.setItem('ADMIN_KEY', key); load(key); }}>Přihlásit</button>
        <button className="btn" onClick={()=>load()}>Načíst</button>
      </div>
      {error && <div className="card p-4 text-red-600">{error}</div>}
      {!items && !error && <div className="skeleton h-24" />}
      {items && (
        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left p-2">Čas</th>
                <th className="text-left p-2">Název</th>
                <th className="text-left p-2">Typ</th>
                <th className="text-left p-2">Produkt</th>
                <th className="text-left p-2">Kraj</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Akce</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{new Date(it.created_at).toLocaleString('cs-CZ')}</td>
                  <td className="p-2">{it.nazev}</td>
                  <td className="p-2">{it.typ_inzeratu}</td>
                  <td className="p-2">{it.produkt}</td>
                  <td className="p-2">{it.kraj}</td>
                  <td className="p-2">{it.status}</td>
                  <td className="p-2 space-x-2">
                    <button className="btn" onClick={()=>act(it.id, 'archive')}>Archivovat</button>
                    <button className="btn" onClick={()=>act(it.id, 'restore')}>Obnovit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}