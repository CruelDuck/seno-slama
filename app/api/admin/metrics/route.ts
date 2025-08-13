import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

function ok(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || new URL(req.url).searchParams.get('key') || ''
  return key && key === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = supabaseService()
  const nowIso = new Date().toISOString()

  const [all, verified, archived, last7] = await Promise.all([
    sb.from('inzeraty').select('id', { count: 'exact', head: true }),
    sb.from('inzeraty').select('id', { count: 'exact', head: true }).eq('status','Ověřeno').gt('expires_at', nowIso),
    sb.from('inzeraty').select('id', { count: 'exact', head: true }).eq('status','Archivováno'),
    sb.from('inzeraty').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now()-7*864e5).toISOString()),
  ])

  return NextResponse.json({
    total: all.count || 0,
    verified: verified.count || 0,
    archived: archived.count || 0,
    last7: last7.count || 0,
  })
}
