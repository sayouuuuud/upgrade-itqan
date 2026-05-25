/**
 * Helpers for the halaqat (Quranic study circles) feature.
 *
 * Halaqat live on two platforms:
 *   - 'academy' for the Itqan Academy section (teachers + students)
 *   - 'maqraa'  for the Quran recitation school side (readers + students)
 *
 * The same database tables back both — the `halaqat.platform` column scopes
 * what each role can see and what UI layout is applied.
 */

import type { JWTPayload } from '@/lib/auth'

export type HalaqaPlatform = 'academy' | 'maqraa'

/**
 * Roles that can host/manage halaqat on each platform.
 */
export const HOST_ROLES: Record<HalaqaPlatform, string[]> = {
  academy: ['teacher', 'academy_admin', 'admin'],
  maqraa: ['reader', 'admin', 'reciter_supervisor'],
}

/**
 * Roles that can administrate (create/edit/delete) halaqat platform-wide.
 */
export const ADMIN_ROLES: Record<HalaqaPlatform, string[]> = {
  academy: ['academy_admin', 'admin'],
  maqraa: ['admin', 'reciter_supervisor'],
}

export function canHostOnPlatform(session: JWTPayload | null, platform: HalaqaPlatform): boolean {
  if (!session) return false
  return HOST_ROLES[platform].includes(session.role)
}

export function canAdminPlatform(session: JWTPayload | null, platform: HalaqaPlatform): boolean {
  if (!session) return false
  return ADMIN_ROLES[platform].includes(session.role)
}

/**
 * Figure out which platform the current session is browsing the halaqat
 * feature on based on the URL prefix.
 */
export function platformFromPathname(pathname: string): HalaqaPlatform {
  if (pathname.startsWith('/academy')) return 'academy'
  return 'maqraa'
}

/**
 * Map a session's role to the default platform they should land on when
 * they hit a shared halaqat surface.
 */
export function defaultPlatformForRole(role: string | undefined): HalaqaPlatform {
  if (!role) return 'academy'
  if (HOST_ROLES.academy.includes(role) || role === 'parent') return 'academy'
  if (HOST_ROLES.maqraa.includes(role)) return 'maqraa'
  return 'academy'
}

export interface HalaqaListItem {
  id: string
  name: string
  description: string | null
  teacher_id: string | null
  teacher_name: string | null
  gender: string
  max_students: number
  current_students: number
  meeting_link: string | null
  livekit_room_name: string | null
  is_active: boolean
  platform: HalaqaPlatform
  scheduled_at: string | null
  duration_minutes: number | null
  is_live: boolean
  created_at: string
}

export const GENDER_LABELS: Record<string, string> = {
  male: 'ذكور',
  female: 'إناث',
  both: 'مختلط',
  mixed: 'مختلط',
  MALE: 'ذكور',
  FEMALE: 'إناث',
  MIXED: 'مختلط',
}

/**
 * Live-session lookback window. If a live session has been ongoing longer
 * than this we still surface it as "live" but it likely needs to be ended
 * manually by the host.
 */
export const LIVE_SESSION_MAX_HOURS = 6
