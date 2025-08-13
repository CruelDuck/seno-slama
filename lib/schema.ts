import { z } from 'zod'
import { KRAJE, OKRESY, ROKY_SKLIZNE, type Kraj } from '@/lib/cz'

export const InzeratSchema = z.object({
  typ_inzeratu: z.enum(['Nabídka','Poptávka']),
  nazev: z.string().min(5, 'Zadejte název').max(120),
  produkt: z.enum(['Seno','Sláma']),
  mnozstvi_baliky: z.coerce.number().int().positive('Zadejte množství (kladné celé číslo)'),
  kraj: z.enum(KRAJE as any, { errorMap: () => ({ message: 'Vyberte kraj' }) }),
  okres: z.string().optional().nullable(), // zkontrolujeme vazbu na kraj níže
  sec: z.string().max(20).optional().nullable(),
  rok_sklizne: z.enum(ROKY_SKLIZNE as any).optional().nullable(),
  cena_za_balik: z.coerce.number().int().nonnegative().optional().nullable(),
  popis: z.string().max(1200).optional().nullable(),
  kontakt_jmeno: z.string().min(2, 'Zadejte jméno').max(80),
  kontakt_telefon: z.string().min(6, 'Zadejte telefon').max(30),
  kontakt_email: z.string().email('Zadejte platný e-mail'),
}).superRefine((val, ctx) => {
  if (val.okres) {
    const kraj = val.kraj as Kraj
    const allowed = new Set(OKRESY[kraj] || [])
    if (!allowed.has(val.okres)) {
      ctx.addIssue({ path: ['okres'], code: z.ZodIssueCode.custom, message: 'Vybraný okres neodpovídá zvolenému kraji' })
    }
  }
})

export type InzeratInput = z.infer<typeof InzeratSchema>
