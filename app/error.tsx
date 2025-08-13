'use client'
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html><body>
      <div className="container-p py-10 space-y-3">
        <h1 className="text-2xl font-semibold">Jejda, něco se pokazilo</h1>
        <div className="text-sm text-zinc-600">Zkuste to prosím znovu.</div>
        <div className="text-xs text-zinc-500">Digest: {error?.digest ?? '—'}</div>
        <button className="btn" onClick={() => reset()}>Zkusit znovu</button>
      </div>
    </body></html>
  )
}
