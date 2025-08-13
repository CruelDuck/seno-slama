import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function ok(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || new URL(req.url).searchParams.get('key')
  return key && key === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const u = new URL(req.url)
  const to = u.searchParams.get('to')
  if (!to) return NextResponse.json({ error: 'Missing ?to=' }, { status: 400 })

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY missing' })

  const FROM = process.env.EMAIL_FROM || 'noreply@example.com'
  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Test – Seno/Sláma',
      html: '<p>Test e-mail z Resend je OK.</p>'
    })
    if (error) return NextResponse.json({ ok: false, error: String((error as any)?.message || error) })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown error' })
  }
}
