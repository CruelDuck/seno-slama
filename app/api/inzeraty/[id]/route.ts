import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabaseService()
  const { data, error } = await sb
    .from('inzeraty')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'Ověřeno')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (Array.isArray(data.fotky)) {
    const signed: any[] = []
    for (const meta of data.fotky) {
      const p = (meta as any).path || (meta as any).key
      if (!p) continue
      const { data: u } = await sb.storage.from('inzeraty').createSignedUrl(p, 300)
      signed.push({ ...(meta as any), signedUrl: u?.signedUrl })
    }
    ;(data as any).fotky = signed
  }

  return NextResponse.json({ item: data })
}
