import { z } from 'zod'

export const InzeratSchema = z.object({
  typ_inzeratu: z.enum(['Nabídka','Poptávka']),
  nazev: z.string().min(3).max(120),
  produkt: z.enum(['Seno','Sláma']),
  mnozstvi_baliky: z.coerce.number().int().positive(),
  sec: z.string().max(20).optional().or(z.literal('').transform(()=>undefined)),
  // staré textové sloupce necháme (kvůli zpětné kompatibilitě)
  kraj: z.string().max(60).optional(),
  okres: z.string().max(60).optional(),
  // nové FK (preferované)
  kraj_id: z.coerce.number().int().positive().optional(),
  okres_id: z.coerce.number().int().positive().optional(),
  rok_sklizne: z.enum(['2022','2023','2024','2025']).optional().or(z.literal('').transform(()=>undefined)),
  cena_za_balik: z.coerce.number().int().positive().optional().or(z.nan().transform(()=>undefined)).or(z.literal('').transform(()=>undefined)),
  popis: z.string().max(3000).optional(),
  kontakt_jmeno: z.string().min(2).max(80),
  kontakt_telefon: z.string().min(3).max(30),
  kontakt_email: z.string().email(),
})

export type InzeratInput = z.infer<typeof InzeratSchema>