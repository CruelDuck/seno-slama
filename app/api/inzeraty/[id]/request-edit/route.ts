import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { sendEditEmail } from '@/lib/mail'
import { sanitizeText } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData()
  const email = sanitizeText(String(form.get('email') || ''))
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const sb = supabaseService()
  const { data: ad, error } = await sb
    .from('inzeraty')
    .select('id, kontakt_email, nazev')
    .eq('id', params.id)
    .single()
  if (error || !ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (ad.kontakt_email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'E-mail nesouhlasí s vlastníkem inzerátu.' }, { status: 403 })
  }

  const { data: tok, error: e2 } = await sb
    .from('edit_tokens')
    .insert({ inzerat_id: ad.id, email })
    .select('token')
    .single()
  if (e2 || !tok) return NextResponse.json({ error: e2?.message || 'Token failed' }, { status: 500 })

  const res = await sendEditEmail(email, tok.token, ad.nazev)
  return NextResponse.json({ ok: true, emailSent: res.sent, editUrl: res.sent ? undefined : res.url, error: res.error })
}
