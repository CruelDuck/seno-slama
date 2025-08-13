import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

async function getByToken(token: string, sb = supabaseService()) {
  const { data: t } = await sb.from('edit_tokens').select('token,inzerat_id,used,expires_at').eq('token', token).single()
  if (!t) return { error: 'Token not found' }
  if (t.used) return { error: 'Token already used' }
  if (new Date(t.expires_at) < new Date()) return { error: 'Token expired' }
  const { data: ad } = await sb.from('inzeraty').select('id').eq('id', t.inzerat_id).single()
  if (!ad) return { error: 'Ad not found' }
  return { t, ad }
}

export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const sb = supabaseService()
  const found = await getByToken(token, sb)
  if ((found as any).error) return NextResponse.json(found, { status: 400 })
  const { ad } = found as any

  const { error } = await sb.from('inzeraty').delete().eq('id', ad.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('edit_tokens').update({ used: true }).eq('token', token)
  return NextResponse.json({ ok: true })
}
