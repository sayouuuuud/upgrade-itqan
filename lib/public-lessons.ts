import { randomBytes, createHash } from 'crypto'

/** Random URL-safe slug, 12 lowercase chars + digits. */
export function generatePublicSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const buf = randomBytes(12)
  let slug = ''
  for (let i = 0; i < 12; i++) slug += chars[buf[i] % chars.length]
  return slug
}

/** SHA-256 hash an IP address (so we don't store raw IPs). */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  return createHash('sha256').update(ip).digest('hex').slice(0, 64)
}

/** Best-effort visitor IP from common reverse proxy headers. */
export function getRequestIp(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null
  )
}

/** Generate a 32-char visitor token (used for cookie). */
export function generateVisitorToken(): string {
  return randomBytes(16).toString('hex')
}

export type LessonState = 'pre' | 'live' | 'post'

export function lessonStateAt(scheduledAt: Date | string, durationMinutes: number, now: Date = new Date()): LessonState {
  const start = new Date(scheduledAt).getTime()
  const end = start + durationMinutes * 60_000
  const t = now.getTime()
  if (t < start) return 'pre'
  if (t <= end) return 'live'
  return 'post'
}
