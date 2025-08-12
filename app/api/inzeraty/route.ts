// …importy a GET beze změny…

export async function POST(req: NextRequest) {
  const started = Number(req.headers.get('x-form-started-ms') || 0)
  if (!started || Date.now() - started < 2000) {
    return NextResponse.json({ error: 'Příliš rychlý submit.' }, { status: 400 })
  }

  const form = await req.formData()
  if ((form.get('hp') as string) || (form.get('website') as string)) return NextResponse.json({ ok: true })

  const getStr = (k: string) => {
    const v = form.get(k)
    if (typeof v !== 'string') return undefined
    const s = v.trim()
    return s === '' ? undefined : sanitizeText(s)
  }

  const obj: any = {
    typ_inzeratu: getStr('typ_inzeratu'),
    nazev: getStr('nazev'),
    produkt: getStr('produkt'),
    mnozstvi_baliky: getStr('mnozstvi_baliky'),
    kraj: getStr('kraj'),
    okres: getStr('okres'),
    sec: getStr('sec'),
    rok_sklizne: getStr('rok_sklizne'),
    cena_za_balik: getStr('cena_za_balik'),
    popis: getStr('popis'),
    kontakt_jmeno: getStr('kontakt_jmeno'),
    kontakt_telefon: getStr('kontakt_telefon'),
    kontakt_email: getStr('kontakt_email'),
  }

  const parse = InzeratSchema.safeParse(obj)
  if (!parse.success) {
    const flat = parse.error.flatten()
    return NextResponse.json({ error: 'VALIDATION', fieldErrors: flat.fieldErrors }, { status: 422 })
  }

  const files = form.getAll('fotky').filter(Boolean) as File[]
  const maxMb = Number(process.env.UPLOAD_MAX_MB || 2)
  const allowed = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',')
  const metas: any[] = []

  const sb = supabaseService()
  for (const f of files.slice(0,3)) {
    if (!allowed.includes(f.type)) return NextResponse.json({ error: 'Nepodporovaný formát.' }, { status: 400 })
    const mb = f.size / (1024*1024)
    if (mb > maxMb) return NextResponse.json({ error: 'Soubor je příliš velký.' }, { status: 400 })
    const key = (await import('@/lib/utils')).fileKey(f.name)
    const { data, error } = await sb.storage.from('inzeraty').upload(key, await f.arrayBuffer(), { contentType: f.type, upsert: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    metas.push({ path: data.path, mime: f.type, size: f.size })
  }

  const { data: ins, error: e1 } = await sb.from('inzeraty').insert({ ...parse.data, fotky: metas }).select('id, kontakt_email, nazev').single()
  if (e1 || !ins) return NextResponse.json({ error: e1?.message || 'Insert failed' }, { status: 500 })

  const { data: tok, error: e2 } = await sb.from('confirm_tokens').insert({ inzerat_id: ins.id, email: ins.kontakt_email }).select('token').single()
  if (e2 || !tok) return NextResponse.json({ error: e2?.message || 'Token failed' }, { status: 500 })

  const { sendConfirmEmail } = await import('@/lib/mail')
  const res = await sendConfirmEmail(ins.kontakt_email, tok.token, ins.nazev)
  return NextResponse.json({ ok: true, confirmUrl: (res as any).sent ? undefined : (res as any).url })
}