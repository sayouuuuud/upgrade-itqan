import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'


// Force dynamic rendering so Next.js never caches the auth check or the
// redirect() response — without this, a cached 307 from a previous
// unauthenticated visit (or a prefetch request) can cause an infinite loop.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  const allowedRoles = ['admin', 'student_supervisor', 'reciter_supervisor']
  
  if (!session || !allowedRoles.includes(session.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <meta httpEquiv="refresh" content="0; url=/login-admin" />
      </div>
    )
  }

  return <DashboardShell role={session.role as any}>{children}</DashboardShell>
}
