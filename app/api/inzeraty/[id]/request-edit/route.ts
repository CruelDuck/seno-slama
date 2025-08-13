import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { sendEditEmail } from '@/lib/mail'
import { sanitizeText } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData()
  const email = sanitizeText(String(form.get('email') || ''))
  const h = req.headers
  const wantsJSON = (h.get('accept') || '').includes('application/json')

  if (!email) {
    return wantsJSON
      ? NextResponse.json({ error: 'Missing email' }, { status: 400 })
      : NextResponse.redirect(new URL('/upravit?error=missing', req.url))
  }

  const sb = supabaseService()
  const { data: ad, error } = await sb.from('inzeraty').select('id, kontakt_email, nazev').eq('id', params.id).single()
  if (error || !ad) {
    return wantsJSON
      ? NextResponse.json({ error: 'Not found' }, { status: 404 })
      : NextResponse.redirect(new URL('/upravit?error=notfound', req.url))
  }

  if (ad.kontakt_email.toLowerCase() !== email.toLowerCase()) {
    return wantsJSON
      ? NextResponse.json({ error: 'E-mail nesouhlasí' }, { status: 403 })
      : NextResponse.redirect(new URL('/upravit?error=owner', req.url))
  }

  const { data: tok, error: e2 } = await sb.from('edit_tokens').insert({ inzerat_id: ad.id, email }).select('token').single()
  if (e2 || !tok) {
    return wantsJSON
      ? NextResponse.json({ error: 'Token failed' }, { status: 500 })
      : NextResponse.redirect(new URL('/upravit?error=token', req.url))
  }

  const res = await sendEditEmail(email, tok.token, ad.nazev)
  if (wantsJSON) return NextResponse.json({ ok: true, emailSent: res.sent, editUrl: res.sent ? undefined : res.url })
  return NextResponse.redirect(new URL('/upravit?sent=1', req.url))
}
