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
    .select('id, nazev, typ_inzeratu, produkt, kraj, okres, cena_za_balik, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}
