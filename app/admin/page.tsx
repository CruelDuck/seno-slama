import AdminTable from '@/components/AdminTable'

export const metadata = { title: 'Admin – Seno/Sláma' }

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <AdminTable />
    </div>
  )
}