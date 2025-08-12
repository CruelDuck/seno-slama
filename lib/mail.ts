import { Resend } from 'resend'

export async function sendConfirmEmail(email: string, token: string, title: string) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${SITE}/potvrdit?token=${token}`
  const key = process.env.RESEND_API_KEY
  const FROM = process.env.EMAIL_FROM || 'noreply@example.com'

  // Fallback: když nemáme klíč, nepošleme mail a vrátíme URL pro ruční potvrzení
  if (!key) {
    return { sent: false, url }
  }

  const html = `
    <div style="font-family:system-ui,sans-serif">
      <h2>Potvrďte zveřejnění inzerátu</h2>
      <p>Pro <b>${title}</b> klikněte na odkaz níže (platnost 24 h):</p>
      <p><a href="${url}">${url}</a></p>
      <p>Pokud jste nic nevytvářeli, ignorujte tento e-mail.</p>
    </div>`

  const resend = new Resend(key)
  await resend.emails.send({ from: FROM, to: email, subject: 'Potvrzení inzerátu – Seno/Sláma', html })
  return { sent: true, url }
}