'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InzeratSchema } from '@/lib/schema'
import { useEffect, useState } from 'react'
import { KRAJE } from '@/lib/cz'
import { track } from '@vercel/analytics'

type Values = any
type Opt = { id: number; nazev: string }

export default function FormInzerat() {
  const [startedAt, setStartedAt] = useState<number>(0)
  useEffect(()=>{ setStartedAt(Date.now()) }, [])

  const { register, handleSubmit, setError, formState: { errors, isSubmitting }, reset, control, watch, setValue } = useForm<Values>({
    resolver: zodResolver(InzeratSchema as any),
    defaultValues: { typ_inzeratu: 'Nabídka', produkt: 'Seno', kraj_id: undefined, okres_id: undefined, rok_sklizne: '' }
  })

  const krajId = watch('kraj_id') as number | undefined

  // kraje (rychle, fallback na konstanty – okresy můžeš doplnit později)
  const [kraje, setKraje] = useState<Opt[]>([])
  const [okresy, setOkresy] = useState<Opt[]>([])

  useEffect(() => {
    let ok = true
    fetch('/api/ref/kraje').then(r=>r.json()).then(({items})=>{
      if (!ok) return; setKraje(items?.length ? items : KRAJE.map((n,i)=>({ id:i+1, nazev:n })))
    }).catch(()=> setKraje(KRAJE.map((n,i)=>({ id:i+1, nazev:n }))))
    return ()=>{ ok=false }
  }, [])

  useEffect(() => {
    let ok = true
    if (!krajId) { setOkresy([]); setValue('okres_id', undefined as any); return }
    fetch('/api/ref/okresy?kraj_id='+krajId).then(r=>r.json()).then(({items})=>{
      if (!ok) return; setOkresy(items || []); setValue('okres_id', undefined as any)
    }).catch(()=> setOkresy([]))
    return ()=>{ ok=false }
  }, [krajId, setValue])

  const onSubmit = async (values: Values) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v == null) continue
      fd.append(k, String(v))
    }
    const files = (document.getElementById('fotky') as HTMLInputElement)?.files
    if (files) Array.from(files).slice(0,3).forEach(f=> fd.append('fotky', f))
    fd.append('hp', '')

    const started = Date.now()
    const res = await fetch('/api/inzeraty', { method: 'POST', body: fd, headers: { 'x-form-started-ms': String(startedAt) } })
    const data = await res.json().catch(()=>({} as any))

    if (!res.ok) {
      if (data?.fieldErrors) {
        Object.entries(data.fieldErrors as Record<string, string[]>).forEach(([name, msgs])=>{
          const msg = msgs?.[0]
          if (msg) setError(name as any, { type: 'server', message: msg })
        })
        alert('Zkontrolujte prosím zvýrazněná pole.')
      } else {
        alert('Chyba: ' + (data?.error ?? res.statusText))
      }
      track('inzerat_submit', { status: 'error', ms: Date.now()-started })
      return
    }

    if (data?.emailSent === false && data?.confirmUrl) {
      const err = data.emailError
      alert('E-mail se nepodařilo odeslat (' + (typeof err === 'string' ? err : JSON.stringify(err)) + '). Potvrďte prosím odkaz: ' + data.confirmUrl)
      track('inzerat_submit', { status: 'email_failed', ms: Date.now()-started })
    } else if (data?.confirmUrl) {
      alert('E-mail není nastaven – potvrďte přes: ' + data.confirmUrl)
      track('inzerat_submit', { status: 'email_missing', ms: Date.now()-started })
    } else {
      alert('Hotovo! Zkontrolujte e-mail a potvrďte zveřejnění.')
      track('inzerat_submit', { status: 'ok', ms: Date.now()-started })
    }
    reset()
  }

  const err = (k: string) => (errors as any)[k]?.message as string | undefined
  const invalid = (k: string) => (errors as any)[k]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-5 space-y-5">
      <div className="space-y-1">
        <label className="label">Název</label>
        <input className={`input ${invalid('nazev') ? 'border-red-300' : ''}`} placeholder="Krátký a výstižný titulek" {...register('nazev')} />
        {err('nazev') && <p className="text-xs text-red-600">{err('nazev')}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Typ inzerátu</label>
          <select className="select" {...register('typ_inzeratu')}>
            <option>Nabídka</option><option>Poptávka</option>
          </select>
        </div>
        <div>
          <label className="label">Produkt</label>
          <select className="select" {...register('produkt')}>
            <option>Seno</option><option>Sláma</option>
          </select>
        </div>
        <div>
          <label className="label">Seč (volitelné)</label>
          <input className="input" placeholder="např. 1., 2." {...register('sec')} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Kraj</label>
          <Controller control={control} name="kraj_id" render={({ field }) => (
            <select className={`select ${invalid('kraj_id') ? 'border-red-300' : ''}`} {...field}>
              <option value="">Vyberte kraj</option>
              {kraje.map(k=> <option key={k.id} value={k.id}>{k.nazev}</option>)}
            </select>
          )} />
          {err('kraj_id') && <p className="text-xs text-red-600">{err('kraj_id')}</p>}
        </div>
        <div>
          <label className="label">Okres (podle kraje)</label>
          <Controller control={control} name="okres_id" render={({ field }) => (
            <select className="select" {...field} disabled={!krajId}>
              <option value="">{krajId ? 'Vyberte okres' : 'Nejprve vyberte kraj'}</option>
              {okresy.map(o=> <option key={o.id} value={o.id}>{o.nazev}</option>)}
            </select>
          )} />
        </div>
        <div>
          <label className="label">Rok sklizně</label>
          <Controller control={control} name="rok_sklizne" render={({ field }) => (
            <select className="select" {...field}>
              <option value="">—</option>
              {['2022','2023','2024','2025'].map(r=> <option key={r} value={r}>{r}</option>)}
            </select>
          )} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Množství (ks)</label>
          <input type="number" className={`input ${invalid('mnozstvi_baliky') ? 'border-red-300' : ''}`} {...register('mnozstvi_baliky', { valueAsNumber: true })} />
          {err('mnozstvi_baliky') && <p className="text-xs text-red-600">{err('mnozstvi_baliky')}</p>}
        </div>
        <div>
          <label className="label">Cena za balík (Kč, volitelné)</label>
          <input type="number" className="input" {...register('cena_za_balik', { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <label className="label">Popis (volitelné)</label>
        <textarea className="textarea" rows={5} placeholder="Doplňující informace…" {...register('popis')}></textarea>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Jméno</label>
          <input className={`input ${invalid('kontakt_jmeno') ? 'border-red-300' : ''}`} {...register('kontakt_jmeno')} />
          {err('kontakt_jmeno') && <p className="text-xs text-red-600">{err('kontakt_jmeno')}</p>}
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className={`input ${invalid('kontakt_telefon') ? 'border-red-300' : ''}`} {...register('kontakt_telefon')} />
          {err('kontakt_telefon') && <p className="text-xs text-red-600">{err('kontakt_telefon')}</p>}
        </div>
        <div>
          <label className="label">E-mail</label>
          <input type="email" className={`input ${invalid('kontakt_email') ? 'border-red-300' : ''}`} {...register('kontakt_email')} />
          {err('kontakt_email') && <p className="text-xs text-red-600">{err('kontakt_email')}</p>}
        </div>
      </div>

      <div>
        <label className="label">Fotky (0–3, max 2 MB, JPG/PNG/WebP)</label>
        <input id="fotky" name="fotky" type="file" multiple accept="image/jpeg,image/png,image/webp" className="block text-sm" />
      </div>

      <input type="text" name="website" className="hidden" aria-hidden="true" tabIndex={-1} />
      <div className="flex items-center gap-3">
        <button disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Odesílám…' : 'Odeslat inzerát'}</button>
        <a href="/" className="btn">Zpět</a>
      </div>
    </form>
  )
}
