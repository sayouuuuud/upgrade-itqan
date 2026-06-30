import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    // Only throw when actually used, not when module is imported during build
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL_BUILD) {
      throw new Error("JWT_SECRET environment variable is required in production")
    }
    console.warn("[AUTH] JWT_SECRET not set — using dev fallback. NEVER deploy without setting JWT_SECRET.")
    return new TextEncoder().encode("dev-only-fallback-do-not-deploy")
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

let _jwtSecret: Uint8Array | null = null
function getSecret() {
  if (!_jwtSecret) {
    _jwtSecret = getJwtSecret()
  }
  return _jwtSecret
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
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
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
