import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { isFullAdmin } from '@/lib/academy/access'

// Access Control manages per-user platform permissions and is one of the most
// sensitive admin surfaces. The parent /academy/admin layout already guards the
// whole section, but it also admits scoped supervisors (student/reciter). This
// page must be reachable by FULL admins only, so we enforce a stricter,
// dedicated server-side check here as defense-in-depth. Any non-admin session
// (student, teacher, supervisor, parent, or unauthenticated) is redirected
// before the client page — and its user table — is ever rendered.
export default async function AccessControlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (!isFullAdmin(session)) {
    redirect('/academy')
  }

  return <>{children}</>
}
