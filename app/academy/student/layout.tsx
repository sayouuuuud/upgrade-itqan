import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function AcademyStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard against session lookups failing for any reason (cookie store error,
  // jose import error, etc.). Without this try/catch a thrown exception would
  // bubble up as a 500 with no UI ("This page couldn't load" in the browser).
  let session
  try {
    session = await getSession()
  } catch (err) {
    console.error('[academy/student/layout] getSession failed:', err)
    redirect('/login')
  }

  if (!session) {
    redirect('/login')
  }

  // Determine if user has library access
  const libraryRole = ['student', 'reader'].includes(session.role)
    ? (session.role as 'student' | 'reader')
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
