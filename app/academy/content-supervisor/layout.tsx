import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function ContentSupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const allowed = ['content_supervisor', 'admin', 'academy_admin']
  if (!allowed.includes(session.role)) {
    redirect('/academy/student')
  }

  return (
    <AcademyDashboardShell role="content_supervisor" showModeSwitcher={false}>
      {children}
    </AcademyDashboardShell>
  )
}
