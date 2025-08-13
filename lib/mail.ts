import { Resend } from 'resend'

type SendResult = { sent: boolean; url: string; error?: string }

export async function sendConfirmEmail(email: string, token: string, title: string): Promise<SendResult> {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${SITE}/potvrdit?token=${token}`
  const key = process.env.RESEND_API_KEY
  const FROM = process.env.EMAIL_FROM || 'noreply@example.com'

  if (!key) return { sent: false, url, error: 'RESEND_API_KEY missing' }

  const html = `<div style="font-family:system-ui,sans-serif">
    <h2>Potvrďte zveřejnění inzerátu</h2>
    <p>Pro <b>${title}</b> klikněte na odkaz níže (platnost 24 h):</p>
    <p><a href="${url}">${url}</a></p>
  </div>`

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject: 'Potvrzení inzerátu – Seno/Sláma', html })
    if (error || !data?.id) return { sent: false, url, error: String((error as any)?.message || 'send failed') }
    return { sent: true, url }
  } catch (e: any) {
    return { sent: false, url, error: e?.message || 'unknown error' }
  }
}

export async function sendEditEmail(email: string, token: string, title: string): Promise<SendResult> {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${SITE}/upravit?token=${token}`
  const key = process.env.RESEND_API_KEY
  const FROM = process.env.EMAIL_FROM || 'noreply@example.com'

  if (!key) return { sent: false, url, error: 'RESEND_API_KEY missing' }

  const html = `<div style="font-family:system-ui,sans-serif">
    <h2>Upravit inzerát</h2>
    <p>Pro úpravu <b>${title}</b> klikněte na odkaz (platnost 24 h):</p>
    <p><a href="${url}">${url}</a></p>
  </div>`

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject: 'Upravit inzerát – Seno/Sláma', html })
    if (error || !data?.id) return { sent: false, url, error: String((error as any)?.message || 'send failed') }
    return { sent: true, url }
  } catch (e: any) {
    return { sent: false, url, error: e?.message || 'unknown error' }
  }
}
