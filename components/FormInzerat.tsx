'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InzeratSchema } from '@/lib/schema'
import { useState, useEffect } from 'react'

type Values = any

export default function FormInzerat() {
  const [startedAt, setStartedAt] = useState<number>(0)
  useEffect(()=>{ setStartedAt(Date.now()) }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Values>({
    resolver: zodResolver(InzeratSchema as any),
    defaultValues: {
      typ_inzeratu: 'Nabídka',
      produkt: 'Seno'
    }
  })

  const onSubmit = async (values: Values) => {
    const fd = new FormData()
    Object.entries(values).forEach(([k,v])=> fd.append(k, String(v ?? '')))
    const files = (document.getElementById('fotky') as HTMLInputElement)?.files
    if (files) {
      Array.from(files).slice(0,3).forEach(f=> fd.append('fotky', f))
    }
    fd.append('hp', '') // honeypot should be empty

    const res = await fetch('/api/inzeraty', {
      method: 'POST',
      body: fd,
      headers: {
        'x-form-started-ms': String(startedAt)
      }
    })
    const data = await res.json().catch(()=>({}))
    if (!res.ok) {
      alert('Chyba: ' + (data?.error ?? res.statusText))
      return
    }
    alert('Hotovo! Zkontrolujte e‑mail a potvrďte zveřejnění.')
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-3">
      <input type="text" className="input" placeholder="Název" {...register('nazev')} />
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
      <div className="grid sm:grid-cols-2 gap-3">
        <input className="input" placeholder="Kraj" {...register('kraj')} />
        <input className="input" placeholder="Seč (např. 1., 2.)" {...register('sec')} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <input type="number" className="input" placeholder="Množství (ks)" {...register('mnozstvi_baliky', { valueAsNumber: true })} />
        <input className="input" placeholder="Rok sklizně" {...register('rok_sklizne')} />
        <input type="number" className="input" placeholder="Cena za balík (Kč) – volitelně" {...register('cena_za_balik', { valueAsNumber: true })} />
      </div>
      <textarea className="textarea" rows={5} placeholder="Popis (volitelné)" {...register('popis')}></textarea>
      <div className="grid sm:grid-cols-3 gap-3">
        <input className="input" placeholder="Kontakt – Jméno" {...register('kontakt_jmeno')} />
        <input className="input" placeholder="Kontakt – Telefon" {...register('kontakt_telefon')} />
        <input type="email" className="input" placeholder="Kontakt – E‑mail" {...register('kontakt_email')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Fotky (0–3, max 2 MB, JPG/PNG/WebP)</label>
        <input id="fotky" name="fotky" type="file" multiple accept="image/jpeg,image/png,image/webp" className="block" />
      </div>
      <input type="text" name="website" style={{display:'none'}} aria-hidden="true" tabIndex={-1} />
      <button disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Odesílám…' : 'Odeslat inzerát'}</button>
      {Object.keys(errors).length ? <pre className="text-red-600 text-xs">{JSON.stringify(errors, null, 2)}</pre> : null}
    </form>
  )
}