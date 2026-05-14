import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hana-lazan-secret-key-change-in-production"
)

export type AllRoles = "student" | "reader" | "admin" | "student_supervisor" | "reciter_supervisor" | "teacher" | "parent" | "academy_admin" | "fiqh_supervisor" | "content_supervisor" | "supervisor" | "quality_supervisor"

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
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
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
