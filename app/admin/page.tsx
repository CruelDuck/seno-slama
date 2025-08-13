import type { Metadata } from 'next'
import AdminClient from './AdminClient'

export const metadata: Metadata = {
  title: 'Admin – Seno/Sláma',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AdminClient />
}
