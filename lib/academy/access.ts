/**
 * Academy RBAC route resolution — single source of truth.
 *
 * The middleware (proxy.ts) is the first line of defense, but it can be bypassed
 * when it isn't running: stale deployments, demo mode (no DATABASE_URL), or
 * matcher gaps. Every academy dashboard layout therefore re-enforces the role
 * server-side as defense-in-depth.
 *
 * To stop that per-layout logic from drifting (which is exactly how a teacher /
 * admin ends up able to view the student dashboard by typing the URL), the
 * decision lives here as a pure function that can be unit-tested exhaustively.
 */

export interface AccessSessionLike {
  role: string
  academy_roles?: string[] | null
}

export const SUPERVISOR_ROLES = [
  "supervisor",
  "content_supervisor",
  "fiqh_supervisor",
  "quality_supervisor",
  "student_supervisor",
  "reciter_supervisor",
  "academy_admin",
] as const

function hasRole(session: AccessSessionLike, role: string): boolean {
  if (session.role === role) return true
  return Array.isArray(session.academy_roles) && session.academy_roles.includes(role)
}

function hasAnyRole(session: AccessSessionLike, roles: readonly string[]): boolean {
  if (roles.includes(session.role)) return true
  return (
    Array.isArray(session.academy_roles) &&
    session.academy_roles.some((r) => roles.includes(r))
  )
}

/** True when the user is allowed to view the /academy/student dashboard. */
export function isStudentLike(session: AccessSessionLike): boolean {
  return hasRole(session, "student") || hasRole(session, "parent")
}

/**
 * True only for FULL academy administrators.
 *
 * Note this is intentionally stricter than the /academy/admin section guard,
 * which also admits scoped supervisors (student_supervisor / reciter_supervisor)
 * for the user-management pages. The most sensitive admin surfaces — e.g.
 * Access Control, which edits per-user platform permissions — must be limited to
 * real admins, so they use this check instead.
 */
export function isFullAdmin(session: AccessSessionLike): boolean {
  return (
    session.role === "admin" ||
    session.role === "academy_admin" ||
    hasRole(session, "admin")
  )
}

/**
 * Resolve where a user hitting /academy/student should go.
 *
 * Returns `null` when the user is allowed to stay (student / parent). Otherwise
 * returns the dashboard path the user should be redirected to for their role.
 * This mirrors — and is the canonical implementation of — the guard previously
 * inlined in app/academy/student/layout.tsx.
 */
export function resolveStudentDashboardRedirect(session: AccessSessionLike): string | null {
  if (isStudentLike(session)) return null

  if (session.role === "admin") return "/academy/admin"
  if (hasRole(session, "teacher")) return "/academy/teacher"
  if (hasAnyRole(session, SUPERVISOR_ROLES)) return "/academy/supervisor"

  // Authenticated but none of the known academy roles: send to academy root.
  return "/academy"
}
