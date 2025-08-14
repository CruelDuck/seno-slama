import { NextResponse } from 'next/server'
import { supabaseAnon } from '@/lib/supabaseAnon'

export const runtime = 'edge'

export async function GET() {
  const sb = supabaseAnon()

  // 1) anonymní SELECT – RLS má vracet jen Ověřeno + neexpirované
  const { data: list, error: selErr } = await sb
    .from('inzeraty')
    .select('id,status,expires_at')
    .limit(3)

  // 2) anonymní UPDATE – tentokrát to zkusíme na skutečném řádku,
  //    který anonym VIDI (tj. RLS SELECT ho pustil).
  let updateDenied: boolean | null = null
  if (list && list.length) {
    const targetId = list[0].id
    const { error: updErr } = await sb
      .from('inzeraty')
      .update({ nazev: 'RLS TEST (nemělo projít)' })
      .eq('id', targetId)

    // Pokud RLS funguje, updErr musí být neprázdné → updateDenied = true
    updateDenied = !!updErr
  }

  return NextResponse.json({
    ok: !selErr,
    updateDenied, // true = UPDATE správně zamítnut (RLS OK), false = problém
    sample: list ?? [],
  })
}
