'use client'
import Image from 'next/image'
import { useMemo } from 'react'

export type Ad = {
  id: string
  typ_inzeratu: 'Nabídka' | 'Poptávka'
  nazev: string
  produkt: 'Seno' | 'Sláma'
  mnozstvi_baliky: number
  kraj: string
  rok_sklizne: string | null
  cena_za_balik: number | null
  fotky: any[] | null
}

export default function CardAd({ ad }: { ad: Ad }) {
  const first = ad.fotky?.[0] as any
  const price = ad.cena_za_balik != null ? `${ad.cena_za_balik.toLocaleString('cs-CZ')} Kč/ks` : '—'
  const badge = ad.typ_inzeratu === 'Nabídka' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  return (
    <a className="card block overflow-hidden group" href={`#${ad.id}`}>
      <div className="relative aspect-[16/9] bg-neutral-100">
        {first?.signedUrl ? (
          <Image src={first.signedUrl} alt={ad.nazev} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
        ) : null}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={`badge ${badge}`}>{ad.typ_inzeratu}</span>
          <span className="badge">{ad.produkt}</span>
          <span className="ml-auto text-neutral-500">{ad.kraj}</span>
        </div>
        <h3 className="font-semibold line-clamp-2">{ad.nazev}</h3>
        <div className="flex items-center justify-between text-sm text-neutral-700">
          <span>Množství: <b>{ad.mnozstvi_baliky}</b> ks</span>
          <span className="font-semibold">{price}</span>
        </div>
      </div>
    </a>
  )
}