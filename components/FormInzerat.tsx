'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InzeratSchema } from '@/lib/schema'
import { useState, useEffect } from 'react'

const KRAJE = [
  'Hlavní město Praha','Středočeský','Jihočeský','Plzeňský','Karlovarský','Ústecký',
  'Liberecký','Královéhradecký','Pardubický','Vysočina','Jihomoravský',
  'Olomoucký','Zlínský','Moravskoslezský'
]

type Values = any

export default function FormInzerat() {
  const [startedAt, setStartedAt] = useState<number>(0)
  useEffect(()=>{ setStartedAt(Date.now()) }, [])

  const { register, handleSubmit, setError, formState: { errors, isSubmitting }, reset } = useForm<Values>({
    resolver: zodResolver(InzeratSchema as any),
    defaultValues: { typ_inzeratu: 'Nabídka', produkt: 'Seno' }
  })

  const onSubmit = async (values: Values) => {
    const fd = new FormData()

    // neposílej prázdné volitelné hodnoty
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v == null) continue
      fd.append(k, String(v))
    }

    const files = (document.getElementById('fotky') as HTMLInputElement)?.files
    if (files) Array.from(files).slice(0,3).forEach(f=> fd.append('fotky', f))

    // honeypot
    fd.append('hp', '')

    const res = await fetch('/api/inzeraty', {
      method: 'POST',
      body: fd,
      headers: { 'x-form-started-ms': String(startedAt) }
    })

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
      return
    }

    if (data?.confirmUrl) {
      alert('E-mail zatím není nastaven. Potvrďte prosím zveřejnění přes tento odkaz: ' + data.confirmUrl)
    } else {
      alert('Hotovo! Zkontrolujte e-mail a potvrďte zveřejnění.')
    }
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-3">
      <input type="text" className="input" placeholder="Název" {...register('nazev')} />
      {errors.nazev && <p className="text-red-600 text-xs">{errors.nazev.message as any}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        <select className="select" {...register('typ_inzeratu')}>
          <option>Nabídka</option>
          <option>Poptávka</option>
        </select>
        <select className="select" {...register('produkt')}>
          <option>Seno</option>
          <option>Sláma</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <select className="select" {...register('kraj')}>
          <option value="">– Vyberte kraj –</option>
          {KRAJE.map(k=> <option key={k} value={k}>{k}</option>)}
        </select>
        <input className="input" placeholder="Okres (volitelné)" {...register('okres')} />
        <input className="input" placeholder="Seč (např. 1., 2.)" {...register('sec')} />
      </div>
      {(errors.kraj || errors.okres || errors.sec) && (
        <p className="text-red-600 text-xs">
          {(errors.kraj?.message as any) || (errors.okres?.message as any) || (errors.sec?.message as any)}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <input type="number" className="input" placeholder="Množství (ks)" {...register('mnozstvi_baliky', { valueAsNumber: true })} />
        <input className="input" placeholder="Rok sklizně (např. 2024/25)" {...register('rok_sklizne')} />
        <input type="number" className="input" placeholder="Cena za balík (Kč) – volitelné" {...register('cena_za_balik', { valueAsNumber: true })} />
      </div>
      {(errors.mnozstvi_baliky || errors.rok_sklizne || errors.cena_za_balik) && (
        <p className="text-red-600 text-xs">
          {(errors.mnozstvi_baliky?.message as any) || (errors.rok_sklizne?.message as any) || (errors.cena_za_balik?.message as any)}
        </p>
      )}

      <textarea className="textarea" rows={5} placeholder="Popis (volitelné)" {...register('popis')}></textarea>

      <div className="grid sm:grid-cols-3 gap-3">
        <input className="input" placeholder="Kontakt – Jméno" {...register('kontakt_jmeno')} />
        <input className="input" placeholder="Kontakt – Telefon" {...register('kontakt_telefon')} />
        <input type="email" className="input" placeholder="Kontakt – E-mail" {...register('kontakt_email')} />
      </div>
      {(errors.kontakt_jmeno || errors.kontakt_telefon || errors.kontakt_email) && (
        <p className="text-red-600 text-xs">
          {(errors.kontakt_jmeno?.message as any) || (errors.kontakt_telefon?.message as any) || (errors.kontakt_email?.message as any)}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Fotky (0–3, max 2 MB, JPG/PNG/WebP)</label>
        <input id="fotky" name="fotky" type="file" multiple accept="image/jpeg,image/png,image/webp" className="block" />
      </div>

      <input type="text" name="website" style={{display:'none'}} aria-hidden="true" tabIndex={-1} />
      <button disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Odesílám…' : 'Odeslat inzerát'}</button>
    </form>
  )
}