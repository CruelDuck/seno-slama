import { Resend } from 'resend'

type SendResult = { sent: boolean; url: string; error?: string }

export async function sendConfirmEmail(email: string, token: string, title: string): Promise<SendResult> {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${SITE}/potvrdit?token=${token}`
  const key = process.env.RESEND_API_KEY
  const FROM = process.env.EMAIL_FROM || 'noreply@example.com'

  // Když není klíč, nepadat – vrátíme jen potvrzovací odkaz
  if (!key) return { sent: false, url, error: 'RESEND_API_KEY missing' }

  const html = `
    <div style="font-family:system-ui,sans-serif">
      <h2>Potvrďte zveřejnění inzerátu</h2>
      <p>Pro <b>${title}</b> klikněte na odkaz níže (platnost 24 h):</p>
      <p><a href="${url}">${url}</a></p>
      <p>Pokud jste nic nevytvářeli, ignorujte tento e-mail.</p>
    </div>`

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Potvrzení inzerátu – Seno/Sláma',
      html
    })
    if (error) return { sent: false, url, error: String((error as any)?.message || error) }
    if (!data?.id) return { sent: false, url, error: 'Resend returned no id' }
    return { sent: true, url }
  } catch (e: any) {
    return { sent: false, url, error: e?.message || 'unknown error' }
  }
}
