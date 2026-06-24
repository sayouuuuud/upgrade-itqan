import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'
import { Toaster } from '@/components/ui/sonner'

export default async function AcademyAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const allowedRoles = ['admin', 'academy_admin', 'student_supervisor', 'reciter_supervisor']
  const isAdmin = allowedRoles.includes(session.role) || 
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
      <Toaster richColors position="top-center" />
    </AcademyDashboardShell>
  )
}
