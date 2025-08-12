import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/?confirm=missing', req.url))

  const sb = supabaseService()
  const { data: row, error } = await sb.from('confirm_tokens')
    .select('inzerat_id, used, expires_at')
    .eq('token', token)
    .single()

  if (error || !row || row.used || new Date(row.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/?confirm=failed', req.url))
  }

  const { error: e1 } = await sb.from('inzeraty').update({ status: 'Ověřeno' }).eq('id', row.inzerat_id)
  const { error: e2 } = await sb.from('confirm_tokens').update({ used: true }).eq('token', token)
  if (e1 || e2) return NextResponse.redirect(new URL('/?confirm=error', req.url))
  return NextResponse.redirect(new URL('/?confirm=ok', req.url))
}