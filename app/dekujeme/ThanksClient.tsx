'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@vercel/analytics'

export default function ThanksClient() {
  const sp = useSearchParams()
  useEffect(() => {
    const status = sp.get('s') || 'ok'
    track('inzerat_confirm', { status })
  }, [sp])
  return null
}
