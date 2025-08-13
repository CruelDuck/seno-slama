'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InzeratSchema } from '@/lib/schema'
import { useEffect, useMemo, useState } from 'react'
import { KRAJE, OKRESY, ROKY_SKLIZNE } from '@/lib/cz'

type Values = any

export default function FormInzerat() {
  const [startedAt, setStartedAt] = useState<number>(0)
  useEffect(()=>{ setStartedAt(Date.now()) }, [])

  const { register, handleSubmit, setError, formState: { errors, isSubmitting }, reset, control, watch, setValue } = useForm<Values>({
    resolver: zodResolver(InzeratSchema as any),
    defaultValues: { typ_inzeratu: 'Nabídka', produkt: 'Seno', kraj: '' }
  })

  const kraj = watch('kraj') as keyof typeof OKRESY | ''
  const okresOptions = useMemo(() => kraj ? (OKRESY[kraj] || []) : [], [kraj])

  useEffect(() => { setValue('okres', '') }, [kraj, setValue])

  const onSubmit = async (values: Values) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v == null) continue
      fd.append(k, String(v))
    }
    const files = (document.getElementById('fotky') as HTMLInputElement)?.files
    if (files) Array.from(files).slice(0,3).forEach(f=> fd.append('fotky', f))
    fd.append('hp', '')

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
      return
    }

    if (data?.emailSent === false && data?.confirmUrl) {
      const err = data.emailError
      const errMsg = typeof err === 'string' ? err : JSON.stringify(err)
      alert('E-mail se nepodařilo odeslat (' + errMsg + '). Potvrďte prosím odkaz: ' + data.confirmUrl)
    } else if (data?.confirmUrl) {
      alert('E-mail není nastaven – potvrďte přes: ' + data.confirmUrl)
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
        <Controller control={control} name="kraj" render={({ field }) => (
          <select className="select" {...field}>
            <option value="">– Vyberte kraj –</option>
            {KRAJE.map(k=> <option key={k} value={k}>{k}</option>)}
          </select>
        )} />
        <Controller control={control} name="okres" render={({ field }) => (
          <select className="select" {...field} disabled={!kraj}>
            <option value="">{kraj ? '– Vyberte okres –' : 'Vyberte kraj nejprve'}</option>
            {okresOptions.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        )} />
        <input className="input" placeholder="Seč (např. 1., 2.)" {...register('sec')} />
      </div>
      {(errors.kraj || errors.okres || errors.sec) && (
        <p className="text-red-600 text-xs">
          {(errors.kraj?.message as any) || (errors.okres?.message as any) || (errors.sec?.message as any)}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <input type="number" className="input" placeholder="Množství (ks)" {...register('mnozstvi_baliky', { valueAsNumber: true })} />
        <Controller control={control} name="rok_sklizne" render={({ field }) => (
          <select className="select" {...field}>
            <option value="">– Rok sklizně –</option>
            {ROKY_SKLIZNE.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        )} />
        <input type="number" className="input" placeholder="Cena za balík (Kč) – volitelné" {...register('cena_za_balik', { valueAsNumber: true })} />
      </div>

      <textarea className="textarea" rows={5} placeholder="Popis (volitelné)" {...register('popis')}></textarea>

      <div className="grid sm:grid-cols-3 gap-3">
        <input className="input" placeholder="Kontakt – Jméno" {...register('kontakt_jmeno')} />
        <input className="input" placeholder="Kontakt – Telefon" {...register('kontakt_telefon')} />
        <input type="email" className="input" placeholder="Kontakt – E-mail" {...register('kontakt_email')} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Fotky (0–3, max 2 MB, JPG/PNG/WebP)</label>
        <input id="fotky" name="fotky" type="file" multiple accept="image/jpeg,image/png,image/webp" className="block" />
      </div>

      <input type="text" name="website" style={{display:'none'}} aria-hidden="true" tabIndex={-1} />
      <button disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Odesílám…' : 'Odeslat inzerát'}</button>
    </form>
  )
}
