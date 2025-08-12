import FormInzerat from '@/components/FormInzerat'

export const metadata = { title: 'Přidat inzerát – Seno/Sláma' }

export default function PridatPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Přidat inzerát</h1>
      <p className="text-neutral-600 text-sm">Po odeslání Vám přijde potvrzovací e‑mail; po potvrzení bude inzerát viditelný po dobu 30 dní.</p>
      <FormInzerat />
    </div>
  )
}