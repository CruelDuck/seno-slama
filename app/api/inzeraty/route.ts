import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseService } from '@/lib/supabaseServer'
import { InzeratSchema } from '@/lib/schema'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rateLimit'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://seno-slama.vercel.app'
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com'
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const UPLOAD_MAX_MB = Number(process.env.UPLOAD_MAX_MB || 2)
const ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp')
  .split(',').map(s => s.trim()).filter(Boolean)

// ---- helpers ----
function json(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, init)
}

async function signPhotos(paths: string[]) {
  if (!paths?.length) return []
  const sb = supabaseService()
  const s = sb.storage.from('inzeraty')
  const out: { signedUrl: string }[] = []
  for (const p of paths) {
    const { data } = await s.createSignedUrl(p, 60 * 60) // 1h
    if (data?.signedUrl) out.push({ signedUrl: data.signedUrl })
  }
  return out
}

function cleanText(s: unknown, max = 3000) {
  if (typeof s !== 'string') return undefined
  const stripped = s.replace(/<[^>]*>/g, '').trim()
  return stripped.slice(0, max)
}

// ---- GET /api/inzeraty?typ=&produkt=&kraj=&kraj_id=&okres=&okres_id=&rok=&cmin=&cmax=&sort=&page= ----
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const typ = url.searchParams.get('typ') || undefined
  const produkt = url.searchParams.get('produkt') || undefined
  const kraj = url.searchParams.get('kraj') || undefined
  const okres = url.searchParams.get('okres') || undefined
  const kraj_id = url.searchParams.get('kraj_id') || undefined
  const okres_id = url.searchParams.get('okres_id') || undefined
  const rok = url.searchParams.get('rok') || undefined
  const cmin = url.searchParams.get('cmin') ? Number(url.searchParams.get('cmin')) : undefined
  const cmax = url.searchParams.get('cmax') ? Number(url.searchParams.get('cmax')) : undefined
  const sort = url.searchParams.get('sort') || 'nejnovejsi'
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.min(60, Math.max(1, Number(url.searchParams.get('page_size') || 60)))
  const offset = (page - 1) * pageSize

  const sb = supabaseService()
  let q = sb.from('inzeraty')
    .select('*', { count: 'exact' })
    .eq('status', 'Ověřeno')
    .gt('expires_at', new Date().toISOString())

  if (typ) q = q.eq('typ_inzeratu', typ)
  if (produkt) q = q.eq('produkt', produkt)
  if (kraj_id) q = q.eq('kraj_id', Number(kraj_id))
  else if (kraj) q = q.eq('kraj', kraj)
  if (okres_id) q = q.eq('okres_id', Number(okres_id))
  else if (okres) q = q.eq('okres', okres)
  if (rok) q = q.eq('rok_sklizne', rok)
  if (typeof cmin === 'number' && !Number.isNaN(cmin)) q = q.gte('cena_za_balik', cmin)
  if (typeof cmax === 'number' && !Number.isNaN(cmax)) q = q.lte('cena_za_balik', cmax)

  if (sort === 'cena_asc') q = q.order('cena_za_balik', { ascending: true, nullsFirst: true })
  else if (sort === 'cena_desc') q = q.order('cena_za_balik', { ascending: false /* nulls default (u DESC bývají první) */ })
  else q = q.order('created_at', { ascending: false })

  const { data, error, count } = await q.range(offset, offset + pageSize - 1)
  if (error) return json({ items: [], count: 0 })

  // podepsané URL pro fotky
  const items = await Promise.all((data || []).map(async (row: any) => {
    const paths: string[] = (row.fotky || []).map((f: any) => f?.path).filter(Boolean)
    const signed = await signPhotos(paths)
    return { ...row, fotky: signed }
  }))

  return json({ items, count })
}

// ---- POST /api/inzeraty (multipart/form-data) ----
export async function POST(req: NextRequest) {
  // Rate-limit: max 1 odeslání / 60 s na IP
  const rl = await rateLimit(req, 'inzeraty_create', 1, 60)
  if (rl.limited) {
    return json({ error: 'Odesíláte příliš často. Zkuste to prosím za minutu.' }, { status: 429 })
  }

  const ct = req.headers.get('content-type') || ''
  if (!ct.includes('multipart/form-data')) {
    return json({ error: 'Očekávám multipart/form-data.' }, { status: 400 })
  }

  // anti-spam: honeypot + min. 2 s mezi otevřením a odesláním
  const started = Number(req.headers.get('x-form-started-ms') || 0)
  if (!started || Date.now() - started < 2000) {
    return json({ error: 'Příliš rychlý submit.' }, { status: 400 })
  }

  const fd = await req.formData()
  const honeypot = String(fd.get('hp') || fd.get('website') || '')
  if (honeypot.trim() !== '') return json({ ok: true }) // bot → „OK“, ale nic neuděláme

  // poskládej payload
  const body: Record<string, any> = {}
  for (const [k, v] of fd.entries()) {
    if (k === 'fotky') continue
    if (typeof v === 'string') body[k] = v
  }

  // normalizace textů
  body.nazev = cleanText(body.nazev, 120)
  body.popis = cleanText(body.popis, 3000)
  body.sec = cleanText(body.sec, 20)

  // validace (Zod schéma už má coerce na čísla atd.)
  const parsed = InzeratSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const e of parsed.error.issues) {
      if (!fieldErrors[e.path[0] as string]) fieldErrors[e.path[0] as string] = []
      fieldErrors[e.path[0] as string].push(e.message)
    }
    return json({ error: 'Neplatná data', fieldErrors }, { status: 400 })
  }
  const values = parsed.data

  // ulož inzerát (status Nové, expirace +30 dní)
  const sb = supabaseService()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const insertPayload: any = {
    ...values,
    status: 'Nové',
    expires_at: expiresAt,
  }

  // kompatibilita: když přišel kraj_id/okres_id, nepropaguj duplicitně textové
  if (values.kraj_id) delete insertPayload.kraj
  if (values.okres_id) delete insertPayload.okres

  const { data: created, error: insErr } = await sb.from('inzeraty').insert(insertPayload).select().maybeSingle()
  if (insErr || !created) return json({ error: 'Uložení selhalo.' }, { status: 500 })

  // upload fotek (0–3), validuj typ a velikost
  const files = fd.getAll('fotky').filter(Boolean) as File[]
  const bucket = sb.storage.from('inzeraty')
  const savedPaths: string[] = []

  for (let i = 0; i < Math.min(3, files.length); i++) {
    const f = files[i]
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      continue // ignoruj neplatný typ
    }
    const maxBytes = UPLOAD_MAX_MB * 1024 * 1024
    if (f.size > maxBytes) {
      continue // ignoruj příliš velké
    }
    const ext = f.name.split('.').pop() || 'bin'
    const path = `${created.id}/${crypto.randomUUID()}.${ext}`
    const arrayBuf = await f.arrayBuffer()
    const { error: upErr } = await bucket.upload(path, new Uint8Array(arrayBuf), {
      contentType: f.type,
      upsert: false,
    })
    if (!upErr) savedPaths.push(path)
  }

  if (savedPaths.length) {
    await sb.from('inzeraty').update({ fotky: savedPaths.map(p => ({ path: p })) }).eq('id', created.id)
  }

  // vytvoř potvrzovací token
  const token = crypto.randomUUID()
  await sb.from('confirm_tokens').insert({
    token,
    inzerat_id: created.id,
    email: values.kontakt_email,
    used: false,
  })

  const confirmUrl = `${SITE}/potvrdit?token=${token}`
  let emailSent: boolean | undefined
  let emailError: any = undefined

  // pošli e-mail (pokud je nastaven Resend)
  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: values.kontakt_email,
        subject: 'Potvrzení inzerátu (Seno/Sláma)',
        html: `<p>Dobrý den,</p>
<p>potvrďte prosím vložení inzerátu kliknutím na odkaz:</p>
<p><a href="${confirmUrl}">${confirmUrl}</a></p>
<p>Odkaz platí 24 hodin.</p>`,
      })
      emailSent = true
    } catch (e: any) {
      emailSent = false
      emailError = e?.message || e
    }
  }

  // odpověď
  return json({
    ok: true,
    id: created.id,
    emailSent,
    emailError,
    confirmUrl: resend ? (emailSent ? undefined : confirmUrl) : confirmUrl,
  })
}
