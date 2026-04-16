import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    // Usually parents just have 'parent' role
    // We already added middleware protection, but a check here is good too
    redirect('/login')
  }

  return <AcademyDashboardShell role="parent">{children}</AcademyDashboardShell>
}
