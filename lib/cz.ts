export const KRAJE = [
  'Hlavní město Praha',
  'Středočeský',
  'Jihočeský',
  'Plzeňský',
  'Karlovarský',
  'Ústecký',
  'Liberecký',
  'Královéhradecký',
  'Pardubický',
  'Vysočina',
  'Jihomoravský',
  'Olomoucký',
  'Zlínský',
  'Moravskoslezský',
] as const

export type Kraj = typeof KRAJE[number]

export const OKRESY: Record<Kraj, string[]> = {
  'Hlavní město Praha': ['Praha'],
  'Středočeský': ['Benešov','Beroun','Kladno','Kolín','Kutná Hora','Mělník','Mladá Boleslav','Nymburk','Praha-východ','Praha-západ','Příbram','Rakovník'],
  'Jihočeský': ['České Budějovice','Český Krumlov','Jindřichův Hradec','Písek','Prachatice','Strakonice','Tábor'],
  'Plzeňský': ['Domažlice','Klatovy','Plzeň-město','Plzeň-jih','Plzeň-sever','Rokycany','Tachov'],
  'Karlovarský': ['Cheb','Karlovy Vary','Sokolov'],
  'Ústecký': ['Děčín','Chomutov','Litoměřice','Louny','Most','Teplice','Ústí nad Labem'],
  'Liberecký': ['Česká Lípa','Jablonec nad Nisou','Liberec','Semily'],
  'Královéhradecký': ['Hradec Králové','Jičín','Náchod','Rychnov nad Kněžnou','Trutnov'],
  'Pardubický': ['Chrudim','Pardubice','Svitavy','Ústí nad Orlicí'],
  'Vysočina': ['Havlíčkův Brod','Jihlava','Pelhřimov','Třebíč','Žďár nad Sázavou'],
  'Jihomoravský': ['Blansko','Brno-město','Brno-venkov','Břeclav','Hodonín','Vyškov','Znojmo'],
  'Olomoucký': ['Jeseník','Olomouc','Prostějov','Přerov','Šumperk'],
  'Zlínský': ['Kroměříž','Uherské Hradiště','Vsetín','Zlín'],
  'Moravskoslezský': ['Bruntál','Frýdek-Místek','Karviná','Nový Jičín','Opava','Ostrava-město'],
}

export const ROKY_SKLIZNE = ['2022','2023','2024','2025'] as const
