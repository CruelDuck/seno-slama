export function sanitizeText(s: string) {
  return s.replace(/[\u0000-\u001F\u007F<>]/g, ' ').trim()
}

export function fileKey(originalName: string) {
  const ext = originalName.split('.').pop() || 'bin'
  const id = crypto.randomUUID()
  return `inzeraty/${id}.${ext}`
}