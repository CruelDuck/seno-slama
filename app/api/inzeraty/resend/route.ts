import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { sendConfirmEmail } from '@/lib/mail'

function ok(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || new URL(req.url).searchParams.get('key') || ''
  return key && key === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const sb = supabaseService()
  const { data: ad, error } = await sb.from('inzeraty').select('id,nazev,kontakt_email').eq('id', id).single()
  if (error || !ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: tok, error: e2 } = await sb.from('confirm_tokens').insert({ inzerat_id: ad.id, email: ad.kontakt_email }).select('token').single()
  if (e2 || !tok) return NextResponse.json({ error: 'Token failed' }, { status: 500 })

  const res = await sendConfirmEmail(ad.kontakt_email, tok.token, ad.nazev)
  return NextResponse.json({ ok: true, emailSent: res.sent })
}
