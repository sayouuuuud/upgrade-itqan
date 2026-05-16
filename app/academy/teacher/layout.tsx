import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function AcademyTeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if user is a teacher
  const isTeacher = session.role === 'teacher' ||
    session.academy_roles?.includes('teacher')

  if (!isTeacher) {
    redirect('/academy/student')
  }

  // Server-side approval-status guard: pending and rejected teachers should
  // never land on the teacher dashboard. They go to /academy/pending where
  // they can complete or re-submit their application. Without this, soft
  // navigation on the client (or the public-navbar redirect for logged-in
  // users) would bounce them to "/" and the user gets stuck in a loop.
  const user = await queryOne<{ approval_status: string | null }>(
    `SELECT approval_status FROM users WHERE id = $1`,
    [session.sub]
  )
  const status = user?.approval_status
  if (status === 'pending_approval' || status === 'rejected') {
    redirect('/academy/pending')
  }

  return (
    <AcademyDashboardShell
      role="teacher"
      showModeSwitcher={false}
    >
      {children}
    </AcademyDashboardShell>
  )
}
