import { NextRequest, NextResponse } from 'next/server'
import { InzeratSchema } from '@/lib/schema'
import { supabaseService } from '@/lib/supabaseServer'
import { sendConfirmEmail } from '@/lib/mail'
import { sanitizeText, fileKey } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const typ = url.searchParams.get('typ')
  const produkt = url.searchParams.get('produkt')
  const kraj = url.searchParams.get('kraj')
  const okres = url.searchParams.get('okres')
  const rok = url.searchParams.get('rok')
  const sort = url.searchParams.get('sort') ?? 'newest'

  const sb = supabaseService()
  let q = sb
    .from('inzeraty')
    .select('*')
    .eq('status', 'Ověřeno')
    .gt('expires_at', new Date().toISOString())

  if (typ) q = q.eq('typ_inzeratu', typ)
  if (produkt) q = q.eq('produkt', produkt)
  if (kraj) q = q.eq('kraj', kraj)
  if (okres) q = q.eq('okres', okres)
  if (rok) q = q.eq('rok_sklizne', rok)

  if (sort === 'cena_asc') q = q.order('cena_za_balik', { ascending: true, nullsFirst: true })
  else if (sort === 'cena_desc') q = q.order('cena_za_balik', { ascending: false, nullsLast: true })
  else q = q.order('created_at', { ascending: false })

  const { data, error } = await q.limit(60)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = await Promise.all((data ?? []).map(async (it: any) => {
    if (Array.isArray(it.fotky) && it.fotky.length) {
      const signed: any[] = []
      for (const meta of it.fotky) {
        const p = (meta as any).path || (meta as any).key
        if (!p) continue
        const { data: u } = await sb.storage.from('inzeraty').createSignedUrl(p, 120)
        signed.push({ ...(meta as any), signedUrl: u?.signedUrl })
      }
      it.fotky = signed
    }
    return it
  }))

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const started = Number(req.headers.get('x-form-started-ms') || 0)
  if (!started || Date.now() - started < 2000) {
    return NextResponse.json({ error: 'Příliš rychlý submit.' }, { status: 400 })
  }

  const form = await req.formData()

  // honeypot – když je vyplněn, jen tiše skončíme jako OK
  if ((form.get('hp') as string) || (form.get('website') as string)) {
    return NextResponse.json({ ok: true })
  }

  const getStr = (k: string) => {
    const v = form.get(k)
    if (typeof v !== 'string') return undefined
    const s = v.trim()
    return s === '' ? undefined : sanitizeText(s)
  }

  const obj: any = {
    typ_inzeratu: getStr('typ_inzeratu'),
    nazev: getStr('nazev'),
    produkt: getStr('produkt'),
    mnozstvi_baliky: getStr('mnozstvi_baliky'),
    kraj: getStr('kraj'),
    okres: getStr('okres'),
    sec: getStr('sec'),
    rok_sklizne: getStr('rok_sklizne'),
    cena_za_balik: getStr('cena_za_balik'),
    popis: getStr('popis'),
    kontakt_jmeno: getStr('kontakt_jmeno'),
    kontakt_telefon: getStr('kontakt_telefon'),
    kontakt_email: getStr('kontakt_email'),
  }

  const parse = InzeratSchema.safeParse(obj)
  if (!parse.success) {
    const flat = parse.error.flatten()
    return NextResponse.json({ error: 'VALIDATION', fieldErrors: flat.fieldErrors }, { status: 422 })
  }

  // Upload fotek (0–3)
  const files = form.getAll('fotky').filter(Boolean) as File[]
  const maxMb = Number(process.env.UPLOAD_MAX_MB || 2)
  const allowed = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',')
  const metas: any[] = []

  const sb = supabaseService()
  for (const f of files.slice(0, 3)) {
    if (!allowed.includes(f.type)) {
      return NextResponse.json({ error: 'Nepodporovaný formát.' }, { status: 400 })
    }
    const mb = f.size / (1024 * 1024)
    if (mb > maxMb) {
      return NextResponse.json({ error: 'Soubor je příliš velký.' }, { status: 400 })
    }
    const key = fileKey((f as any).name || 'upload.bin')
    const { data: up, error: upErr } = await sb.storage
      .from('inzeraty')
      .upload(key, await f.arrayBuffer(), { contentType: f.type, upsert: false })
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
    metas.push({ path: up.path, mime: f.type, size: f.size })
  }

  // Insert inzerátu
  const { data: ins, error: e1 } = await sb
    .from('inzeraty')
    .insert({ ...parse.data, fotky: metas })
    .select('id, kontakt_email, nazev')
    .single()
  if (e1 || !ins) {
    return NextResponse.json({ error: e1?.message || 'Insert failed' }, { status: 500 })
  }

  // Token pro potvrzení
  const { data: tok, error: e2 } = await sb
    .from('confirm_tokens')
    .insert({ inzerat_id: ins.id, email: ins.kontakt_email })
    .select('token')
    .single()
  if (e2 || !tok) {
    return NextResponse.json({ error: e2?.message || 'Token failed' }, { status: 500 })
  }

  // Odeslat e-mail (nebo vrátit URL, pokud e-mail nejde)
  const mail = await sendConfirmEmail(ins.kontakt_email, tok.token, ins.nazev)

  return NextResponse.json({
    ok: true,
    emailSent: mail.sent,
    emailError:
      typeof mail.error === 'string'
        ? mail.error
        : (mail.error ? JSON.stringify(mail.error) : undefined),
    confirmUrl: mail.sent ? undefined : mail.url,
  })
}
