import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { redirect } from 'next/navigation'

function isMissingUsersTable(error: unknown) {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === '42P01'
    && error instanceof Error
    && error.message.includes('relation "users" does not exist')
  )
}

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'reader') {
    redirect('/login')
  }

  // Mirror the teacher layout: pending/rejected readers go to /reader/pending
  // instead of being able to access the reader dashboard.
  let user: { approval_status: string | null } | null = null
  try {
    user = await queryOne<{ approval_status: string | null }>(
      `SELECT approval_status FROM users WHERE id = $1`,
      [session.sub]
    )
  } catch (error) {
    if (!isMissingUsersTable(error)) throw error
  }
  const status = user?.approval_status
  if (status === 'pending_approval' || status === 'rejected') {
    redirect('/reader/pending')
  }

  return <DashboardShell role="reader">{children}</DashboardShell>
}
