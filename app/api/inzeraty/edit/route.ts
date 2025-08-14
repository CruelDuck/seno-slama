import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rateLimit'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://seno-slama.vercel.app'
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com'
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function json(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, init)
}

// GET /api/inzeraty/edit?token=...  → vrátí ad pro editaci
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || ''
  if (!token) return json({ error: 'Chybí token.' }, { status: 400 })

  const sb = supabaseService()
  const { data: tok } = await sb.from('confirm_tokens').select('*')
    .eq('token', token).eq('used', false).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!tok) return json({ error: 'Neplatný nebo expirovaný odkaz.' }, { status: 400 })

  const { data: ad } = await sb.from('inzeraty').select('*').eq('id', tok.inzerat_id).maybeSingle()
  if (!ad) return json({ error: 'Inzerát nenalezen.' }, { status: 404 })

  return json({ ad })
}

// POST /api/inzeraty/edit  (form z /upravit bez tokenu) → pošle e-mail s odkazem
export async function POST(req: NextRequest) {
  // Rate-limit: max 3 požadavky / hod.
  const rl = await rateLimit(req, 'inzeraty_edit_request', 3, 3600)
  if (rl.limited) {
    return json({ error: 'Příliš mnoho požadavků. Zkuste to později.' }, { status: 429 })
  }

  const ct = req.headers.get('content-type') || ''
  if (!ct.includes('multipart/form-data') && !ct.includes('application/x-www-form-urlencoded')) {
    return json({ error: 'Špatný formát.' }, { status: 400 })
  }

  const fd = await req.formData()
  const id = String(fd.get('id') || '')
  const email = String(fd.get('email') || '').toLowerCase().trim()
  if (!id || !email) return json({ error: 'Chybí data.' }, { status: 400 })

  const sb = supabaseService()
  const { data: ad } = await sb.from('inzeraty').select('id,kontakt_email,nazev').eq('id', id).maybeSingle()

  // „privacy preserving“ — i když nesedí, vrátíme stejnou odpověď
  const redirect = NextResponse.redirect(`${SITE}/upravit?sent=1`, 302)
  if (!ad || String(ad.kontakt_email).toLowerCase() !== email) {
    return redirect
  }

  const token = crypto.randomUUID()
  await sb.from('confirm_tokens').insert({ token, inzerat_id: id, email, used: false })

  const url = `${SITE}/upravit?token=${token}`
  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Odkaz pro úpravu inzerátu (Seno/Sláma)',
        html: `<p>Dobrý den,</p><p>klikněte na odkaz pro úpravu inzerátu:</p><p><a href="${url}">${url}</a></p><p>Odkaz je platný 24 hodin.</p>`,
      })
    } catch {
      // i kdyby e-mail selhal, UI ukáže potvrzení; odkaz lze dohledat v logu
    }
  }

  return redirect
}

// PUT /api/inzeraty/edit?token=...  → uloží změny (bez změny typu/produktu/e-mailu)
export async function PUT(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || ''
  if (!token) return json({ error: 'Chybí token.' }, { status: 400 })
  const body = await req.json().catch(()=> ({} as any))

  const sb = supabaseService()
  const { data: tok } = await sb.from('confirm_tokens').select('*')
    .eq('token', token).eq('used', false).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!tok) return json({ error: 'Neplatný nebo expirovaný odkaz.' }, { status: 400 })

  const patch: any = {}
  const n = (k: string) => {
    const v = body[k]
    if (v === '' || v == null) patch[k] = null
    else patch[k] = Number(v)
  }
  const s = (k: string) => {
    const v = body[k]
    if (v === '' || v == null) patch[k] = null
    else patch[k] = String(v).toString()
  }

  // povolená pole
  s('nazev')
  n('mnozstvi_baliky')
  n('cena_za_balik')
  s('rok_sklizne')
  s('popis')
  s('kontakt_telefon')

  const { error } = await sb.from('inzeraty').update(patch).eq('id', tok.inzerat_id)
  if (error) return json({ error: 'Uložení selhalo.' }, { status: 500 })

  return json({ ok: true })
}
 
