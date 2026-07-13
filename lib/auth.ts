import { SignJWT, jwtVerify } from "jose"

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return new TextEncoder().encode(process.env.JWT_SECRET)
  }
  // Derive a stable secret from POSTGRES_URL (always present in production).
  // This guarantees tokens signed on any deployment remain valid as long as
  // the database connection string doesn't change.
  const base = process.env.POSTGRES_URL || process.env.DATABASE_URL || "dev-only-fallback-do-not-deploy"
  return new TextEncoder().encode("itqaan-jwt:" + base)
}

// No module-level cache — getJwtSecret() is cheap and always returns a value,
// so there is no risk of caching a null that was produced by a previous throw.
function getSecret() {
  return getJwtSecret()
}

export type AllRoles = "student" | "reader" | "admin" | "super_admin" | "maqraa_admin" | "student_supervisor" | "reciter_supervisor" | "teacher" | "parent" | "academy_admin" | "fiqh_supervisor" | "content_supervisor" | "supervisor" | "quality_supervisor"

export interface JWTPayload {
  sub: string
  email: string
  role: AllRoles
  name: string
  academy_roles?: string[] // For users with multiple academy roles
  has_academy_access?: boolean
  has_quran_access?: boolean
  platform_preference?: string
  iat: number
  exp: number
}

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  // Try primary secret first
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JWTPayload
  } catch {
    // Fall back to the old dev secret so existing sessions stay valid
    // after a secret rotation (e.g. first deploy with POSTGRES_URL-derived secret)
    try {
      const legacy = new TextEncoder().encode("dev-only-fallback-do-not-deploy")
      const { payload } = await jwtVerify(token, legacy)
      return payload as unknown as JWTPayload
    } catch {
      return null
    }
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  // Import cookies only when the function is called (not at module load time)
  // This avoids issues with Next.js build process when this module is imported
  // from contexts that aren't Server Components
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  return verifyToken(token)
}

export function requireRole(
  session: JWTPayload | null,
  roles: AllRoles[]
): boolean {
  if (!session) return false
  return roles.includes(session.role)
}

// Check if user has any of the specified academy roles
export function hasAcademyRole(
  session: JWTPayload | null,
  roles: string[]
): boolean {
  if (!session) return false
  if (roles.includes(session.role)) return true
  if (session.academy_roles) {
    return session.academy_roles.some(r => roles.includes(r))
  }
  return false
}

// A "super admin" has unrestricted access to the whole platform, including the
// public site (homepage/SEO), theme, branding and role management. The legacy
// `admin` role is treated as a super admin so every existing `role === 'admin'`
// gate keeps working; `super_admin` is the new explicit alias for clarity.
export function isSuperAdmin(session: JWTPayload | null): boolean {
  if (!session) return false
  return session.role === "admin" || session.role === "super_admin"
}

// A "maqraa admin" manages the Qur'an / recitation side (/admin maqraa pages).
// Super admins implicitly have maqraa-admin powers.
export function isMaqraaAdmin(session: JWTPayload | null): boolean {
  if (!session) return false
  if (isSuperAdmin(session)) return true
  if (session.role === "maqraa_admin") return true
  return session.academy_roles?.includes("maqraa_admin") ?? false
}

// An "academy admin" manages the academy side (/academy/admin pages).
// Super admins implicitly have academy-admin powers.
export function isAcademyAdmin(session: JWTPayload | null): boolean {
  if (!session) return false
  if (isSuperAdmin(session)) return true
  if (session.role === "academy_admin") return true
  return session.academy_roles?.includes("academy_admin") ?? false
}

// Any of the three admin tiers. Used to gate the shared /admin shell.
export function isAnyAdmin(session: JWTPayload | null): boolean {
  return isSuperAdmin(session) || isMaqraaAdmin(session) || isAcademyAdmin(session)
}

// Resolve the correct "home" landing page for a logged-in user based on their
// role and platform access flags. This MUST stay in sync with the
// `getRedirectPath` logic used on the login page so the homepage header button
// never points at a non-existent route (e.g. the bare `/academy`, which has no
// page and 404s). Approval-status routing is handled by middleware, not here.
export function getRoleHomePath(session: JWTPayload | null): string {
  if (!session) return "/login"
  const role = session.role
  if (role === "admin" || role === "super_admin") return "/admin"
  if (role === "maqraa_admin") return "/admin"
  if (role === "academy_admin") return "/academy/admin"
  if (role === "student_supervisor" || role === "reciter_supervisor") return "/admin"
  if (role === "fiqh_supervisor") return "/academy/fiqh-supervisor"
  if (role === "content_supervisor") return "/academy/content-supervisor"
  if (role === "supervisor") return "/academy/supervisor"
  if (role === "quality_supervisor") return "/admin"
  if (role === "reader") return "/reader"
  if (role === "teacher") return "/academy/teacher"
  if (role === "parent") return "/academy/parent"
  // Student: route based on platform access flags.
  const hasAcademy = session.has_academy_access !== false
  const hasQuran = session.has_quran_access !== false
  if (hasAcademy && !hasQuran) return "/academy/student"
  if (!hasAcademy && hasQuran) return "/student"
  // Both available → default to academy (the primary platform).
  return "/academy/student"
}

// Get the user's primary academy role for routing
export function getAcademyRole(session: JWTPayload | null): string | null {
  if (!session) return null
  if (['teacher', 'academy_admin', 'parent'].includes(session.role)) {
    return session.role
  }
  if (session.academy_roles && session.academy_roles.length > 0) {
    return session.academy_roles[0]
  }
  // Students enrolled in academy courses get academy_student role
  if (session.role === 'student') {
    return 'academy_student'
  }
  return null
}
