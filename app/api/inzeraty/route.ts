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
  const rok = url.searchParams.get('rok')
  const sort = url.searchParams.get('sort') ?? 'newest'

  // Use service to also sign URLs for images (bucket is private)
  const sb = supabaseService()
  let q: any = sb.from('inzeraty').select('*').eq('status', 'Ověřeno').lt('expires_at', new Date(Date.now()+365*86400*1000).toISOString())
  if (typ) q = q.eq('typ_inzeratu', typ)
  if (produkt) q = q.eq('produkt', produkt)
  if (kraj) q = q.eq('kraj', kraj)
  if (rok) q = q.eq('rok_sklizne', rok)

  if (sort === 'cena_asc') q = q.order('cena_za_balik', { ascending: true, nullsFirst: true })
  else if (sort === 'cena_desc') q = q.order('cena_za_balik', { ascending: false, nullsLast: true })
  else q = q.order('created_at', { ascending: false })

  const { data, error } = await q.limit(60)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // sign image URLs
  const items = await Promise.all((data||[]).map(async (it: any) => {
    if (it.fotky?.length) {
      const signed = []
      for (const meta of it.fotky) {
        const p = meta.path || meta.key
        const { data: u } = await sb.storage.from('inzeraty').createSignedUrl(p, 120)
        signed.push({ ...meta, signedUrl: u?.signedUrl })
      }
      it.fotky = signed
    }
    return it
  }))

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  // Anti-spam
  const started = Number(req.headers.get('x-form-started-ms') || 0)
  if (!started || Date.now() - started < 2000) {
    return NextResponse.json({ error: 'Příliš rychlý submit.' }, { status: 400 })
  }

  const form = await req.formData()
  // honeypot
  if ((form.get('hp') as string) || (form.get('website') as string)) {
    return NextResponse.json({ ok: true })
  }

  const obj: any = {}
  for (const key of ['typ_inzeratu','nazev','produkt','mnozstvi_baliky','kraj','sec','rok_sklizne','cena_za_balik','popis','kontakt_jmeno','kontakt_telefon','kontakt_email']) {
    const v = form.get(key)
    if (typeof v === 'string') obj[key] = sanitizeText(v)
  }

  const parse = InzeratSchema.safeParse(obj)
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })

  const files = form.getAll('fotky').filter(Boolean) as File[]
  const maxMb = Number(process.env.UPLOAD_MAX_MB || 2)
  const allowed = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',')
  const metas: any[] = []

  const sb = supabaseService()
  for (const f of files.slice(0,3)) {
    if (!allowed.includes(f.type)) return NextResponse.json({ error: 'Nepodporovaný formát.' }, { status: 400 })
    const mb = f.size / (1024*1024)
    if (mb > maxMb) return NextResponse.json({ error: 'Soubor je příliš velký.' }, { status: 400 })
    const key = fileKey(f.name)
    const { data, error } = await sb.storage.from('inzeraty').upload(key, await f.arrayBuffer(), { contentType: f.type, upsert: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    metas.push({ path: data.path, mime: f.type, size: f.size })
  }

  // 1) uložit inzerát
  const { data: ins, error: e1 } = await sb.from('inzeraty').insert({ ...parse.data, fotky: metas }).select('id, kontakt_email, nazev').single()
  if (e1 || !ins) return NextResponse.json({ error: e1?.message || 'Insert failed' }, { status: 500 })

  // 2) token
  const { data: tok, error: e2 } = await sb.from('confirm_tokens').insert({ inzerat_id: ins.id, email: ins.kontakt_email }).select('token').single()
  if (e2 || !tok) return NextResponse.json({ error: e2?.message || 'Token failed' }, { status: 500 })

  // 3) e-mail
  await sendConfirmEmail(ins.kontakt_email, tok.token, ins.nazev)

  return NextResponse.json({ ok: true })
}