import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function auth(req: NextRequest) {
  const hdr = req.headers.get('x-admin-key')
  const urlKey = new URL(req.url).searchParams.get('key')
  const provided = hdr || urlKey || ''
  return provided && provided === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const u = new URL(req.url)
  const to = u.searchParams.get('to')
  const from = u.searchParams.get('from') || process.env.EMAIL_FROM || ''
  const key = process.env.RESEND_API_KEY

  if (!to)   return NextResponse.json({ ok: false, error: 'Missing ?to=' }, { status: 400 })
  if (!from) return NextResponse.json({ ok: false, error: 'EMAIL_FROM missing' }, { status: 500 })
  if (!key)  return NextResponse.json({ ok: false, error: 'RESEND_API_KEY missing' }, { status: 500 })

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: 'Test – Seno/Sláma',
      html: '<p>Test e-mail z Resend je OK.</p>',
      text: 'Test e-mail z Resend je OK.'
    })

    if (error) {
      // Vrať detailní info, ne [object Object]
      const err = (error as any)
      return NextResponse.json({
        ok: false,
        error: err?.message || 'send failed',
        details: err
      }, { status: 400 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || 'unknown error',
      details: e
    }, { status: 500 })
  }
}
