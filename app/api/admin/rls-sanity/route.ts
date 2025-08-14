import { NextResponse } from 'next/server'
import { supabaseAnon } from '@/lib/supabaseAnon'

export const runtime = 'edge'

export async function GET() {
  const sb = supabaseAnon()

  // 1) anonymní SELECT – RLS by měla vracet jen Ověřeno + neexpirované
  const { data: list, error: selErr } = await sb
    .from('inzeraty')
    .select('id,status,expires_at')
    .limit(5)

  // 2) anonymní UPDATE – RLS by ho měla ZAKÁZAT
  const { error: updErr } = await sb
    .from('inzeraty')
    .update({ nazev: 'TEST' })
    .eq('id', '00000000-0000-0000-0000-000000000000')

  return NextResponse.json({
    ok: !selErr,            // SELECT proběhl
    updateDenied: !!updErr, // true = UPDATE správně zakázán
    sample: list ?? [],     // pár řádků na ukázku
  })
}
