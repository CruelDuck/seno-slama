import Image from 'next/image'
import Link from 'next/link'

export type Ad = {
  id: string
  typ_inzeratu: 'Nabídka' | 'Poptávka'
  nazev: string
  produkt: 'Seno' | 'Sláma'
  mnozstvi_baliky: number
  kraj?: string | null
  okres?: string | null
  kraj_id?: number | null
  okres_id?: number | null
  rok_sklizne?: string | null
  cena_za_balik?: number | null
  fotky?: { signedUrl?: string }[]
}

export default function CardAd({ ad }: { ad: Ad }) {
  const img = ad.fotky?.[0]?.signedUrl
  const isOffer = ad.typ_inzeratu === 'Nabídka'
  const theme = ad.produkt === 'Seno' ? 'seno' : 'slama'
  const price =
    typeof ad.cena_za_balik === 'number'
      ? `${ad.cena_za_balik.toLocaleString('cs-CZ')} Kč/ks`
      : '—'

  return (
    <Link
      href={`/inzerat/${ad.id}`}
      className={`block rounded-2xl border hover:shadow-sm transition card-${theme}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl">
        {img ? (
          <Image
            src={img}
            alt={ad.nazev}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className={`ph ${theme === 'seno' ? 'ph-seno' : 'ph-slama'}`} />
        )}

        <div
          className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium badge-${theme}`}
        >
          <span>{ad.typ_inzeratu}</span>
          <span>•</span>
          <span>{ad.produkt}</span>
        </div>
      </div>

      <div className="p-3">
        <div className="line-clamp-2 font-medium">{ad.nazev}</div>
        <div className="mt-1 text-sm text-zinc-600">
          {(ad.kraj || '')}
          {ad.okres ? ` • ${ad.okres}` : ''}
          {ad.rok_sklizne ? ` • ${ad.rok_sklizne}` : ''}
        </div>
        <div className="mt-2 text-sm">
          <span className="text-zinc-500">Množství:</span>{' '}
          <b>{ad.mnozstvi_baliky}</b>
          <span className="ml-3 text-zinc-500">Cena:</span> <b>{price}</b>
          {!isOffer && <span className="ml-1 text-zinc-400">(poptávka)</span>}
        </div>
      </div>
    </Link>
  )
}
