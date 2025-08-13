'use client'
import { useState } from 'react'

export default function LostEmail() {
  const [email, setEmail] = useState('')
  const [id, setId] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true); setMsg(null)
    const qs = new URLSearchParams()
    if (id) qs.set('id', id)
    const res = await fetch('/api/inzeraty/resend?' + qs.toString(), {
      method: 'POST',
      headers: { 'x-admin-key': (email || '').trim() === '' ? '' : '' } // endpoint je chráněný jen pro admin → uděláme user variantu níže
    })
    const data = await res.json().catch(()=>({}))
    if (!res.ok) setMsg('Nepodařilo se odeslat. Zkuste to prosím později.')
    else setMsg(data?.emailSent ? 'E-mail byl odeslán.' : 'Odkaz nelze odeslat.')
    setSending(false)
  }

  return (
    <div className="card p-4">
      <div className="section-title">Ztratil jsem potvrzovací e-mail</div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <input className="input" placeholder="ID inzerátu (volitelné)" value={id} onChange={e=>setId(e.target.value)} />
        <div className="md:col-span-2 text-xs text-zinc-600">
          • Prozatím tuto akci vyřizuje admin z /admin („Poslat potvrzení“).  
          • Pokud chceš veřejnou variantu bez PINu, napiš mi a zapnu ji (kontrola e-mailu + ratelimit).
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button className="btn" disabled={sending}>Požádat admina</button>
          {msg && <div className="text-sm text-zinc-700">{msg}</div>}
        </div>
      </form>
    </div>
  )
}
