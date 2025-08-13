import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

function ok(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || new URL(req.url).searchParams.get('key') || ''
  return key && key === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseService()
    .from('inzeraty')
    .select('kontakt_jmeno, kontakt_email')
    .not('kontakt_email', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const uniq = new Map<string, string>()
  ;(data || []).forEach(r => {
    const e = (r as any).kontakt_email?.toLowerCase?.()
    if (e && !uniq.has(e)) uniq.set(e, (r as any).kontakt_jmeno || '')
  })

  const rows = [['jmeno','email'], ...Array.from(uniq.entries()).map(([email, jmeno]) => [jmeno, email])]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kontakty.csv"'
    }
  })
}
