import { z } from 'zod'

export const InzeratSchema = z.object({
  typ_inzeratu: z.enum(['Nabídka','Poptávka']),
  nazev: z.string().min(5, 'Zadejte název').max(120),
  produkt: z.enum(['Seno','Sláma']),
  mnozstvi_baliky: z.coerce.number().int().positive('Zadejte množství (kladné celé číslo)'),
  kraj: z.string().min(2, 'Zadejte kraj').max(50),
  okres: z.string().max(50).optional().nullable(),               // volitelné
  sec: z.string().max(20).optional().nullable(),
  rok_sklizne: z.string().max(20).optional().nullable(),         // volný text (např. 2024/25)
  cena_za_balik: z.coerce.number().int().nonnegative().optional().nullable(),
  popis: z.string().max(1200).optional().nullable(),
  kontakt_jmeno: z.string().min(2, 'Zadejte jméno').max(80),
  kontakt_telefon: z.string().min(6, 'Zadejte telefon').max(30),
  kontakt_email: z.string().email('Zadejte platný e-mail'),
})
export type InzeratInput = z.infer<typeof InzeratSchema>