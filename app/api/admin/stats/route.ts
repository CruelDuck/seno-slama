import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

function ok(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || new URL(req.url).searchParams.get('key') || ''
  return key && key === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const days = Math.max(1, Math.min(180, Number(new URL(req.url).searchParams.get('days') || '30')))
  const since = new Date(Date.now() - days * 864e5).toISOString()

  const sb = supabaseService()
  const { data, error } = await sb
    .from('inzeraty')
    .select('kraj, produkt, typ_inzeratu, created_at, cena_za_balik')
    .gte('created_at', since)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // JS agregace (MVP)
  const byKraj: Record<string, number> = {}
  const trend: Record<string, number> = {}
  let sum = 0, n = 0; const ceny: number[] = []
  for (const r of data || []) {
    const k = (r as any).kraj || 'Neznámý'
    byKraj[k] = (byKraj[k] || 0) + 1
    const d = (r as any).created_at.slice(0,10)
    trend[d] = (trend[d] || 0) + 1
    if ((r as any).typ_inzeratu === 'Nabídka') {
      const c = (r as any).cena_za_balik
      if (typeof c === 'number') { ceny.push(c); sum += c; n++ }
    }
  }
  ceny.sort((a,b)=>a-b)
  const median = ceny.length ? ceny[Math.floor(ceny.length/2)] : null
  const mean = n ? Math.round(sum / n) : null

  return NextResponse.json({ byKraj, trend, mean, median })
}
