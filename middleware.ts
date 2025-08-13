import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const WINDOW = 15 * 60 // 15 min
const LIMIT = 5

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== '/api/inzeraty' || req.method !== 'POST') return NextResponse.next()
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return NextResponse.next()

  const key = `rl:${ip}`
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipeline: [['INCR', key], ['EXPIRE', key, WINDOW], ['GET', key]] })
  }).then(r=>r.json()).catch(()=>null)
  const count = Number(res?.result?.[2]) || 0
  if (count > LIMIT) return NextResponse.json({ error: 'Příliš mnoho požadavků, zkuste to později.' }, { status: 429 })
  return NextResponse.next()
}

export const config = { matcher: ['/api/inzeraty'] }
