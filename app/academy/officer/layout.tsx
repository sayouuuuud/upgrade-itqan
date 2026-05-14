import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'
import { queryOne } from '@/lib/db'

export default async function AcademyOfficerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Verify the user is a registered & active officer
  const isOfficer = await queryOne<{ id: string }>(
    `SELECT id FROM fiqh_officers WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [session.sub]
  )
  if (!isOfficer) {
    redirect('/academy/student/fiqh')
  }

  // Map their underlying role to the appropriate shell role
  const r = session.role
  const shellRole =
    r === 'admin' || r === 'academy_admin'
      ? 'academy_admin'
      : r === 'teacher'
      ? 'teacher'
      : r === 'parent'
      ? 'parent'
      : r === 'student_supervisor' || r === 'reciter_supervisor'
      ? 'supervisor'
      : 'academy_student'

  return (
    <AcademyDashboardShell role={shellRole as any}>
      {children}
    </AcademyDashboardShell>
  )
}
