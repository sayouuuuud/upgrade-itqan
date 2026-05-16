import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'reader') {
    redirect('/login')
  }

  // Mirror the teacher layout: pending/rejected readers go to /reader/pending
  // instead of being able to access the reader dashboard.
  const user = await queryOne<{ approval_status: string | null }>(
    `SELECT approval_status FROM users WHERE id = $1`,
    [session.sub]
  )
  const status = user?.approval_status
  if (status === 'pending_approval' || status === 'rejected') {
    redirect('/reader/pending')
  }

  return <DashboardShell role="reader">{children}</DashboardShell>
}
