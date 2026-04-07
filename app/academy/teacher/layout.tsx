import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
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

  return (
    <AcademyDashboardShell 
      role="teacher"
      showModeSwitcher={false}
    >
      {children}
    </AcademyDashboardShell>
  )
}
