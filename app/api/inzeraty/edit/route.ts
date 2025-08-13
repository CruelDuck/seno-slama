import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { InzeratSchema } from '@/lib/schema'
import { sanitizeText } from '@/lib/utils'

export const runtime = 'nodejs'

// povoleno upravit jen tato pole
const EDITABLE_FIELDS = new Set(['mnozstvi_baliky','cena_za_balik','rok_sklizne','popis','kontakt_telefon'])

async function getByToken(token: string, sb = supabaseService()) {
  const { data: t } = await sb
    .from('edit_tokens')
    .select('token, inzerat_id, email, used, expires_at')
    .eq('token', token)
    .single()
  if (!t) return { error: 'Token not found' }
  if (t.used) return { error: 'Token already used' }
  if (new Date(t.expires_at) < new Date()) return { error: 'Token expired' }

  const { data: ad } = await sb.from('inzeraty').select('*').eq('id', t.inzerat_id).single()
  if (!ad) return { error: 'Ad not found' }
  return { t, ad }
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const res = await getByToken(token)
  if ((res as any).error) return NextResponse.json(res, { status: 400 })
  return NextResponse.json({ item: (res as any).ad })
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const sb = supabaseService()
  const found = await getByToken(token, sb)
  if ((found as any).error) return NextResponse.json(found, { status: 400 })
  const { ad, t } = found as any

  const form = await req.formData()
  const obj: any = {}
  EDITABLE_FIELDS.forEach((k)=> {
    const v = form.get(k)
    if (typeof v === 'string') {
      const s = sanitizeText(v.trim())
      if (s !== '') obj[k] = s
      else if (k === 'cena_za_balik') obj[k] = null
    }
  })

  // validace proti plnému schématu – doplníme původní hodnoty
  const merged = { ...ad, ...obj }
  const parsed = InzeratSchema.safeParse(merged)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    return NextResponse.json({ error: 'VALIDATION', fieldErrors: flat.fieldErrors }, { status: 422 })
  }

  const { error: uerr } = await sb.from('inzeraty').update(obj).eq('id', ad.id)
  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })

  await sb.from('edit_tokens').update({ used: true }).eq('token', t.token)

  return NextResponse.json({ ok: true })
}
