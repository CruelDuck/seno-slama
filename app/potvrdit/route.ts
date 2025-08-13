import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const sb = supabaseService()

  // najdi platný a nepoužitý token
  const { data: t, error: e1 } = await sb
    .from('confirm_tokens')
    .select('token, inzerat_id, expires_at, used')
    .eq('token', token)
    .single()

  if (e1 || !t) return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  if (t.used)   return NextResponse.json({ error: 'Already used' }, { status: 400 })
  if (new Date(t.expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 400 })

  // označ inzerát jako Ověřeno
  const { error: e2 } = await sb
    .from('inzeraty')
    .update({ status: 'Ověřeno' })
    .eq('id', t.inzerat_id)

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  // označ token jako použitý
  await sb.from('confirm_tokens').update({ used: true }).eq('token', token)

  // revaliduj homepage
  revalidatePath('/')

  // přesměruj na poděkování (nebo homepage s parametrem)
  return NextResponse.redirect(new URL('/?potvrzeno=1', url.origin))
}
