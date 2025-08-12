import { Resend } from 'resend'
const FROM = process.env.EMAIL_FROM!

export async function sendConfirmEmail(email: string, token: string, title: string) {
  const key = process.env.RESEND_API_KEY
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${SITE}/potvrdit?token=${token}`
  const html = `
    <div style="font-family:system-ui,sans-serif">
      <h2>Potvrďte zveřejnění inzerátu</h2>
      <p>Pro <b>${title}</b> klikněte na odkaz níže (platnost 24 h):</p>
      <p><a href="${url}">${url}</a></p>
      <p>Pokud jste nic nevytvářeli, ignorujte tento e‑mail.</p>
    </div>`

  if (!key) {
    console.warn('RESEND_API_KEY není nastaven – e-mail se neposílá, pouze logujeme URL:', url)
    return
  }
  const resend = new Resend(key)
  await resend.emails.send({ from: FROM, to: email, subject: 'Potvrzení inzerátu – Seno/Sláma', html })
}