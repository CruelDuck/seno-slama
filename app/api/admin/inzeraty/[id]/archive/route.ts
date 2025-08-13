import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'

function ok(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || ''
  return key && key === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabaseService().from('inzeraty').update({ status: 'Archivováno' }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
