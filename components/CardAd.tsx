'use client'
import Image from 'next/image'

export type Ad = {
  id: string
  typ_inzeratu: 'Nabídka' | 'Poptávka'
  nazev: string
  produkt: 'Seno' | 'Sláma'
  mnozstvi_baliky: number
  kraj: string
  okres?: string | null
  rok_sklizne: string | null
  cena_za_balik: number | null
  fotky: any[] | null
}

function Placeholder({ produkt }: { produkt: 'Seno'|'Sláma' }) {
  const gold = produkt === 'Sláma'
  return (
    <div className="placeholder">
      {/* jednoduchá ilustrace balíku */}
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor={gold ? '#fde68a' : '#a7f3d0'} />
            <stop offset="100%" stopColor={gold ? '#f59e0b' : '#22c55e'} />
          </linearGradient>
        </defs>
        <rect x="10" y="18" width="44" height="28" rx="6" fill="url(#g)" stroke={gold ? '#a16207' : '#166534'} strokeWidth="2"/>
        <line x1="16" y1="26" x2="48" y2="26" stroke={gold ? '#a16207' : '#166534'} strokeWidth="2" />
        <line x1="16" y1="38" x2="48" y2="38" stroke={gold ? '#a16207' : '#166534'} strokeWidth="2" />
      </svg>
    </div>
  )
}

export default function CardAd({ ad }: { ad: Ad }) {
  const first = ad.fotky?.[0] as any
  const price = typeof ad.cena_za_balik === 'number'
    ? `${ad.cena_za_balik.toLocaleString('cs-CZ')} Kč/ks`
    : '—'
  const frame = ad.typ_inzeratu === 'Nabídka' ? 'card-offer' : 'card-demand'

  return (
    <a className={`card ${frame} block overflow-hidden group`} href={`/inzerat/${ad.id}`}>
      <div className="relative aspect-[16/9] bg-neutral-100">
        {first?.signedUrl
          ? <Image src={first.signedUrl} alt={ad.nazev} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
          : <Placeholder produkt={ad.produkt} />}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="badge" style={{background: ad.typ_inzeratu==='Nabídka' ? 'var(--accent-50)' : 'var(--gold-50)', color: ad.typ_inzeratu==='Nabídka' ? 'var(--accent-700)' : '#92400e'}}>
            {ad.typ_inzeratu}
          </span>
          <span className="badge">{ad.produkt}</span>
          <span className="ml-auto text-neutral-500">
            {ad.okres ? `${ad.kraj} • ${ad.okres}` : ad.kraj}
          </span>
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
