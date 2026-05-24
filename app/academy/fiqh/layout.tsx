import { getSession } from "@/lib/auth"
import type { JWTPayload } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { AcademyDashboardShell } from "@/components/academy-dashboard-shell"

type AcademyShellRole =
  | "academy_student"
  | "teacher"
  | "academy_admin"
  | "parent"
  | "supervisor"
  | "fiqh_questions_supervisor"
  | "content_supervisor"
type MaqraaShellRole =
  | "student"
  | "reader"
  | "admin"
  | "student_supervisor"
  | "reciter_supervisor"

function hasAcademyRoleClaim(session: JWTPayload, role: string): boolean {
  return session.role === role || !!session.academy_roles?.includes(role)
}

const ACADEMY_ROLES = new Set([
  "academy_student",
  "academy_admin",
  "teacher",
  "parent",
  "supervisor",
  "fiqh_supervisor",
  "content_supervisor",
  "quality_supervisor",
])

function resolveAcademyShellRole(session: JWTPayload): AcademyShellRole {
  if (session.role === "admin" || hasAcademyRoleClaim(session, "academy_admin")) {
    return "academy_admin"
  }
  if (hasAcademyRoleClaim(session, "content_supervisor")) return "content_supervisor"
  if (hasAcademyRoleClaim(session, "fiqh_supervisor"))
    return "fiqh_questions_supervisor"
  if (
    hasAcademyRoleClaim(session, "supervisor") ||
    hasAcademyRoleClaim(session, "quality_supervisor")
  ) {
    return "supervisor"
  }
  if (hasAcademyRoleClaim(session, "teacher")) return "teacher"
  if (hasAcademyRoleClaim(session, "parent")) return "parent"
  return "academy_student"
}

function resolveMaqraaShellRole(session: JWTPayload): MaqraaShellRole {
  if (session.role === "admin") return "admin"
  if (session.role === "reader") return "reader"
  if (session.role === "reciter_supervisor") return "reciter_supervisor"
  if (session.role === "student_supervisor") return "student_supervisor"
  return "student"
}

/**
 * Layout for the unified Fiqh Library. Wraps the page in the same sidebar
 * the user sees elsewhere so they can navigate back to their dashboard,
 * forum, etc. Unauthenticated visitors get the bare page (the GET
 * endpoint already serves library content without auth).
 */
export default async function FiqhLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) {
    return <>{children}</>
  }

  const isAcademy =
    ACADEMY_ROLES.has(session.role) ||
    (session.academy_roles ?? []).some((r) => ACADEMY_ROLES.has(r))

  if (isAcademy) {
    const role = resolveAcademyShellRole(session)
    const libraryRole = ["student", "reader"].includes(session.role)
      ? (session.role as "student" | "reader")
      : null
    return (
      <AcademyDashboardShell
        role={role}
        showModeSwitcher={!!libraryRole}
        libraryRole={libraryRole}
      >
        {children}
      </AcademyDashboardShell>
    )
  }

  const role = resolveMaqraaShellRole(session)
  return <DashboardShell role={role}>{children}</DashboardShell>
}
