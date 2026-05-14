// Centralised permission checks for the community platform.
// Two isolated communities (`academy` / `maqraa`) — moderators in one cannot
// touch content in the other; the global `admin` is the only cross-community
// role.

import type { JWTPayload, AllRoles } from "@/lib/auth"
import type { Community } from "./types"

// Roles that can moderate (pin/lock/hide/delete) academy community content.
const ACADEMY_MOD_ROLES: AllRoles[] = [
  "academy_admin",
  "admin",
  "student_supervisor",
]

const ACADEMY_MOD_ACADEMY_ROLES = [
  "academy_admin",
  "content_supervisor",
  "fiqh_supervisor",
  "quality_supervisor",
  "supervisor",
]

// Roles that can moderate maqraa (Quran reciter) community content.
const MAQRAA_MOD_ROLES: AllRoles[] = [
  "admin",
  "reciter_supervisor",
  "student_supervisor",
]

// Roles that can publish/reject articles in each community.
const ACADEMY_PUBLISHER_ROLES: AllRoles[] = ["academy_admin", "admin"]
const ACADEMY_PUBLISHER_ACADEMY_ROLES = [
  "academy_admin",
  "content_supervisor",
]
const MAQRAA_PUBLISHER_ROLES: AllRoles[] = ["admin", "reciter_supervisor"]

// Author roles per community — who can author articles.
const ACADEMY_AUTHOR_ROLES: AllRoles[] = [
  "teacher",
  "academy_admin",
  "admin",
]
const MAQRAA_AUTHOR_ROLES: AllRoles[] = [
  "reader",
  "reciter_supervisor",
  "admin",
]

function hasAcademyRoleIn(
  session: JWTPayload | null,
  roles: string[]
): boolean {
  if (!session) return false
  if (roles.includes(session.role)) return true
  return !!session.academy_roles?.some((r) => roles.includes(r))
}

/**
 * Can this user access (read/post in) the given community?
 *
 * Academy: anyone with `has_academy_access` or any academy/teacher/parent role.
 * Maqraa:  anyone with `has_quran_access` or any reader-family role.
 * Global `admin` always has access.
 */
export function canAccessCommunity(
  session: JWTPayload | null,
  community: Community
): boolean {
  if (!session) return false
  if (session.role === "admin") return true

  if (community === "academy") {
    if (session.has_academy_access) return true
    return [
      "student",
      "teacher",
      "parent",
      "academy_admin",
      "student_supervisor",
    ].includes(session.role) || hasAcademyRoleIn(session, [
      "academy_admin",
      "content_supervisor",
      "fiqh_supervisor",
      "quality_supervisor",
      "supervisor",
      "academy_student",
    ])
  }

  // maqraa
  if (session.has_quran_access) return true
  return [
    "student",
    "reader",
    "reciter_supervisor",
    "student_supervisor",
  ].includes(session.role)
}

/**
 * Can this user moderate (pin/lock/hide/delete other people's content) in
 * the given community?
 */
export function canModerate(
  session: JWTPayload | null,
  community: Community
): boolean {
  if (!session) return false
  if (session.role === "admin") return true

  if (community === "academy") {
    return (
      ACADEMY_MOD_ROLES.includes(session.role) ||
      hasAcademyRoleIn(session, ACADEMY_MOD_ACADEMY_ROLES)
    )
  }
  return MAQRAA_MOD_ROLES.includes(session.role)
}

/**
 * Can this user author articles in the given community?
 */
export function canAuthorArticle(
  session: JWTPayload | null,
  community: Community
): boolean {
  if (!session) return false
  if (session.role === "admin") return true
  if (community === "academy") {
    return (
      ACADEMY_AUTHOR_ROLES.includes(session.role) ||
      hasAcademyRoleIn(session, ["content_supervisor", "academy_admin"])
    )
  }
  return MAQRAA_AUTHOR_ROLES.includes(session.role)
}

/**
 * Can this user publish / reject articles in the given community?
 */
export function canPublishArticle(
  session: JWTPayload | null,
  community: Community
): boolean {
  if (!session) return false
  if (session.role === "admin") return true
  if (community === "academy") {
    return (
      ACADEMY_PUBLISHER_ROLES.includes(session.role) ||
      hasAcademyRoleIn(session, ACADEMY_PUBLISHER_ACADEMY_ROLES)
    )
  }
  return MAQRAA_PUBLISHER_ROLES.includes(session.role)
}

/**
 * The set of communities the user can access. Useful for top-level navigation
 * and dashboards.
 */
export function accessibleCommunities(session: JWTPayload | null): Community[] {
  if (!session) return []
  const out: Community[] = []
  if (canAccessCommunity(session, "academy")) out.push("academy")
  if (canAccessCommunity(session, "maqraa")) out.push("maqraa")
  return out
}

/**
 * Tells whether the given user is the author of a row (for edit/delete on
 * own content).
 */
export function isAuthor(
  session: JWTPayload | null,
  authorId: string | null | undefined
): boolean {
  if (!session || !authorId) return false
  return session.sub === authorId
}
