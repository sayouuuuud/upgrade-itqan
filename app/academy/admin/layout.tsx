import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function AcademyAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const isAdmin = session.role === 'admin' || 
    session.academy_roles?.includes('admin') || 
    session.academy_roles?.includes('student_supervisor') || 
    session.academy_roles?.includes('reciter_supervisor')
  
  if (!isAdmin) {
    redirect('/academy/student')
  }

  return (
    <AcademyDashboardShell 
      role="academy_admin"
      showModeSwitcher={true}
      libraryRole={session.role}
    >
      {children}
    </AcademyDashboardShell>
  )
}
