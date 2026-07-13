import { cookies } from 'next/headers'
import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { ADMIN_MODE_COOKIE, resolveAdminMode } from '@/lib/admin/roles'


// Force dynamic rendering so Next.js never caches the auth check or the
// redirect() response — without this, a cached 307 from a previous
// unauthenticated visit (or a prefetch request) can cause an infinite loop.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  const allowedRoles = ['admin', 'super_admin', 'maqraa_admin', 'academy_admin', 'student_supervisor', 'reciter_supervisor']

  if (!session || !allowedRoles.includes(session.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <meta httpEquiv="refresh" content="0; url=/login" />
      </div>
    )
  }

  const cookieStore = await cookies()
  const adminMode = resolveAdminMode(
    cookieStore.get(ADMIN_MODE_COOKIE)?.value,
    session.role,
    session.academy_roles ?? [],
  )

  return (
    <DashboardShell role={session.role as any} adminMode={adminMode}>
      {children}
    </DashboardShell>
  )
}
