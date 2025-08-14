import { NextRequest } from 'next/server'

export function getClientIP(req: NextRequest): string {
  const h = req.headers
  // Za reverse proxy (Vercel): X-Forwarded-For bývá "ip1, ip2, ..."
  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = h.get('x-real-ip')
  if (real) return real
  const cf = h.get('cf-connecting-ip')
  if (cf) return cf
  return 'unknown'
}
