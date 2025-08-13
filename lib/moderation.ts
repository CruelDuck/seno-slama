const BAD = [
  'viagra','porn','xxx','bitcoin','casino','loan','credit','free money','sex',
  'escort','hack','crack','fake','scam','výhra','výdělek','rychlý zisk'
]

export function containsBanned(text?: string | null) {
  if (!text) return false
  const t = text.toLowerCase()
  return BAD.some(w => t.includes(w))
}
