import { NextRequest } from 'next/server'
import { supabaseService } from '@/lib/supabaseServer'
import { getClientIP } from './ip'

/**
 * Jednoduchý sliding window limit přes DB.
 * @param routeId - identifikátor (např. 'inzeraty_create')
 * @param max - kolik povolit v okně
 * @param windowSec - délka okna v sekundách
 */
export async function rateLimit(req: NextRequest, routeId: string, max: number, windowSec: number) {
  const ip = getClientIP(req)
  const sb = supabaseService()
  const since = new Date(Date.now() - windowSec * 1000).toISOString()

  // Spočítat pokusy v okně
  const { data: rows, error: selErr } = await sb
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('ip', ip)
    .eq('route', routeId)

  if (selErr) {
    // Bezpečně: když selže DB, raději PUSTIT (neblokovat legitimního uživatele chybou DB)
    return { limited: false, ip }
  }

  const count = (rows as any)?.length ?? 0
  if (count >= max) {
    return { limited: true, ip }
  }

  // Zalogovat aktuální pokus
  await sb.from('rate_limits').insert({ ip, route: routeId })
  return { limited: false, ip }
}
