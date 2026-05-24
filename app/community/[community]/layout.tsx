import { notFound, redirect } from "next/navigation"
import type { JWTPayload } from "@/lib/auth"
import { getSession } from "@/lib/auth"
import {
  accessibleCommunities,
  canAccessCommunity,
  canModerate,
  canPublishArticle,
  isCommunityAdmin,
} from "@/lib/community/permissions"
import { CommunityNav } from "@/components/community/community-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { AcademyDashboardShell } from "@/components/academy-dashboard-shell"
import type { Community } from "@/lib/community/types"

const VALID: Community[] = ["academy", "maqraa"]

type AcademyShellRole = 'academy_student' | 'teacher' | 'academy_admin' | 'parent' | 'supervisor' | 'fiqh_questions_supervisor' | 'content_supervisor'
type MaqraaShellRole = 'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor'

function hasAcademyRoleClaim(session: JWTPayload, role: string): boolean {
  return session.role === role || !!session.academy_roles?.includes(role)
}

/**
 * Pick the academy shell role most appropriate for the current user. The
 * academy forum is reachable by every academy role, so we fall back through
 * the hierarchy: admin → supervisor variants → teacher → parent → student.
 */
function resolveAcademyShellRole(session: JWTPayload): AcademyShellRole {
  if (session.role === 'admin' || hasAcademyRoleClaim(session, 'academy_admin')) {
    return 'academy_admin'
  }
  if (hasAcademyRoleClaim(session, 'content_supervisor')) return 'content_supervisor'
  if (hasAcademyRoleClaim(session, 'fiqh_supervisor')) return 'fiqh_questions_supervisor'
  if (
    hasAcademyRoleClaim(session, 'supervisor') ||
    hasAcademyRoleClaim(session, 'quality_supervisor')
  ) {
    return 'supervisor'
  }
  if (hasAcademyRoleClaim(session, 'teacher')) return 'teacher'
  if (hasAcademyRoleClaim(session, 'parent')) return 'parent'
  return 'academy_student'
}

/**
 * Pick the maqraa (Qur'an) shell role for the current user.
 */
function resolveMaqraaShellRole(session: JWTPayload): MaqraaShellRole {
  if (session.role === 'admin') return 'admin'
  if (session.role === 'reader') return 'reader'
  if (session.role === 'reciter_supervisor') return 'reciter_supervisor'
  if (session.role === 'student_supervisor') return 'student_supervisor'
  return 'student'
}

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  if (!VALID.includes(community as Community)) {
    notFound()
  }

  const session = await getSession()
  if (!session) {
    redirect(`/login?next=/community/${community}`)
  }

  const c = community as Community
  if (!canAccessCommunity(session, c)) {
    redirect("/")
  }

  const inner = (
    <>
      <CommunityNav
        community={c}
        canModerate={canModerate(session, c)}
        canReview={canPublishArticle(session, c)}
        isAdmin={isCommunityAdmin(session, c)}
        alsoHasCommunities={accessibleCommunities(session)}
      />
      <div className="container mx-auto px-3 py-6">{children}</div>
    </>
  )

  // Wrap the community pages in the same dashboard shell the user sees on
  // their other pages, so the main sidebar stays visible (and collapsible)
  // when they navigate into the forum or its admin/settings pages.
  if (c === "academy") {
    const role = resolveAcademyShellRole(session)
    const libraryRole = ['student', 'reader'].includes(session.role)
      ? (session.role as 'student' | 'reader')
      : null
    return (
      <AcademyDashboardShell
        role={role}
        showModeSwitcher={!!libraryRole}
        libraryRole={libraryRole}
      >
        {inner}
      </AcademyDashboardShell>
    )
  }

  // maqraa
  const role = resolveMaqraaShellRole(session)
  return <DashboardShell role={role}>{inner}</DashboardShell>
}
