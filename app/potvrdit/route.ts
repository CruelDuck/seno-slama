import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://seno-slama.vercel.app'
  if (!token) return NextResponse.redirect(site + '/dekujeme?s=err')

  const sb = supabaseService()
  // ověř token
  const { data: tok } = await sb.from('confirm_tokens').select('*')
    .eq('token', token).eq('used', false).gt('expires_at', new Date().toISOString()).maybeSingle()

  if (!tok) return NextResponse.redirect(site + '/dekujeme?s=err')

  // publikuj inzerát
  await sb.from('inzeraty').update({ status: 'Ověřeno' }).eq('id', tok.inzerat_id)

  // označ token jako použitý
  await sb.from('confirm_tokens').update({ used: true }).eq('token', token)

  return NextResponse.redirect(site + '/dekujeme?s=ok')
}
