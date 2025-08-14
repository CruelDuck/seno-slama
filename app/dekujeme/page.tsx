import ThanksClient from './ThanksClient'

export const metadata = { title: 'Děkujeme – Seno/Sláma', robots: { index: false, follow: true } }

export default function Page({ searchParams }: { searchParams?: { s?: string } }) {
  const ok = (searchParams?.s ?? 'ok') === 'ok'
  return (
    <div className="container-p max-w-xl py-10">
      <ThanksClient />
      <div className="card p-6 space-y-3">
        <h1 className="text-2xl font-semibold">{ok ? 'Inzerát potvrzen ✅' : 'Odkaz neplatí ❌'}</h1>
        {ok ? (
          <>
            <p>Váš inzerát je nyní viditelný v katalogu. Děkujeme!</p>
            <div className="flex gap-2">
              <a href="/" className="btn btn-primary">Zpět do katalogu</a>
              <a href="/pridat" className="btn">Přidat další</a>
            </div>
          </>
        ) : (
          <>
            <p>Odkaz je neplatný nebo expiroval. Zkuste odeslat inzerát znovu.</p>
            <a href="/pridat" className="btn btn-primary">Zpět na formulář</a>
          </>
        )}
      </div>
    </div>
  )
}
