import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function AcademyStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Determine if user has library access
  const libraryRole = ['student', 'reader'].includes(session.role) 
    ? session.role as 'student' | 'reader' 
    : null

  return (
    <AcademyDashboardShell 
      role="academy_student"
      showModeSwitcher={!!libraryRole}
      libraryRole={libraryRole}
    >
      {children}
    </AcademyDashboardShell>
  )
}
