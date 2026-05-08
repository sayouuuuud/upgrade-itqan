import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function FiqhSupervisorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')

  const allowed = ['fiqh_supervisor', 'supervisor', 'admin', 'academy_admin']
  if (!allowed.includes(session.role)) redirect('/login')

  return (
    <AcademyDashboardShell role="fiqh_questions_supervisor" showModeSwitcher={false}>
      {children}
    </AcademyDashboardShell>
  )
}
