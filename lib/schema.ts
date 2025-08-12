import { z } from 'zod'

export const InzeratSchema = z.object({
  typ_inzeratu: z.enum(['Nabídka','Poptávka']),
  nazev: z.string().min(5).max(120),
  produkt: z.enum(['Seno','Sláma']),
  mnozstvi_baliky: z.coerce.number().int().positive(),
  kraj: z.string().min(2).max(50),
  sec: z.string().max(20).optional().nullable(),
  rok_sklizne: z.string().max(10).optional().nullable(),
  cena_za_balik: z.coerce.number().int().nonnegative().optional().nullable(),
  popis: z.string().max(1200).optional().nullable(),
  kontakt_jmeno: z.string().min(2).max(80),
  kontakt_telefon: z.string().min(6).max(30),
  kontakt_email: z.string().email(),
  // fotky budou přijaty přes multipart/form-data (0-3 Files)
})
export type InzeratInput = z.infer<typeof InzeratSchema>