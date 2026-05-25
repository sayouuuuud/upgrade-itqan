import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import {
  ADMIN_ROLES,
  HOST_ROLES,
  type HalaqaPlatform,
  defaultPlatformForRole,
} from '@/lib/halaqat'
import { halaqaRoomName } from '@/lib/livekit'
import { assertTeacherAssignable } from '@/lib/teachers'

const ALLOWED_GENDERS = new Set(['male', 'female', 'both', 'mixed'])

function parsePlatform(value: string | null, fallback: HalaqaPlatform): HalaqaPlatform {
  if (value === 'academy' || value === 'maqraa') return value
  return fallback
}

/**
 * GET /api/halaqat
 *
 * Query params:
 *   platform: 'academy' | 'maqraa' (default: inferred from session role)
 *   scope:    'mine' | 'enrolled' | 'all' (default depends on role)
 *
 * Returns the set of halaqat visible to the current user, with denormalised
 * teacher name, current student count and live status.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const platform = parsePlatform(
    url.searchParams.get('platform'),
    defaultPlatformForRole(session.role)
  )
  const scope = url.searchParams.get('scope') || 'auto'

  const isAdmin = ADMIN_ROLES[platform].includes(session.role)
  const isHost = HOST_ROLES[platform].includes(session.role) && !isAdmin

  let resolvedScope: 'all' | 'mine' | 'enrolled' = 'enrolled'
  if (scope === 'all' && isAdmin) resolvedScope = 'all'
  else if (scope === 'mine' && isHost) resolvedScope = 'mine'
  else if (isAdmin) resolvedScope = 'all'
  else if (isHost) resolvedScope = 'mine'
  else resolvedScope = 'enrolled'

  const params: unknown[] = [platform]
  let whereExtra = ''
  if (resolvedScope === 'mine') {
    whereExtra = 'AND h.teacher_id = $2'
    params.push(session.sub)
  } else if (resolvedScope === 'enrolled') {
    whereExtra = `AND EXISTS (
      SELECT 1 FROM halaqat_students hs
      WHERE hs.halaqah_id = h.id AND hs.student_id = $2 AND hs.is_active = TRUE
    )`
    params.push(session.sub)
  }

  const rows = await query<any>(
    `SELECT
        h.id,
        h.name,
        h.description,
        h.teacher_id,
        u.name AS teacher_name,
        h.gender,
        h.max_students,
        h.meeting_link,
        h.livekit_room_name,
        h.is_active,
        h.platform,
        h.scheduled_at,
        h.duration_minutes,
        h.created_at,
        COALESCE((
          SELECT COUNT(*) FROM halaqat_students hs2
          WHERE hs2.halaqah_id = h.id AND hs2.is_active = TRUE
        ), 0)::int AS current_students,
        EXISTS (
          SELECT 1 FROM halaqat_live_sessions hls
          WHERE hls.halaqah_id = h.id AND hls.ended_at IS NULL
        ) AS is_live
     FROM halaqat h
     LEFT JOIN users u ON u.id = h.teacher_id
     WHERE h.platform = $1
       AND h.archived_at IS NULL
       ${whereExtra}
     ORDER BY h.created_at DESC`,
    params
  )

  return NextResponse.json({ data: rows, scope: resolvedScope, platform })
}

/**
 * POST /api/halaqat
 * Body: { name, description?, teacher_id?, gender?, max_students?, meeting_link?, platform?, scheduled_at?, duration_minutes? }
 *
 * Admins can create on either platform. Teachers/Readers create on their
 * own platform with themselves as the teacher.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const platform = parsePlatform(
    body.platform ?? null,
    defaultPlatformForRole(session.role)
  )
  const isAdmin = ADMIN_ROLES[platform].includes(session.role)
  const isHost = HOST_ROLES[platform].includes(session.role) && !isAdmin

  if (!isAdmin && !isHost) {
    return NextResponse.json({ error: 'غير مصرح لك بإنشاء حلقات' }, { status: 403 })
  }

  const name = String(body.name || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'اسم الحلقة مطلوب' }, { status: 400 })
  }

  const gender = String(body.gender || 'both').toLowerCase()
  if (!ALLOWED_GENDERS.has(gender)) {
    return NextResponse.json({ error: 'قيمة الجنس غير صحيحة' }, { status: 400 })
  }

  const maxStudents = Math.max(1, Math.min(500, Number(body.max_students) || 20))

  // Teacher assignment:
  //   - For hosts (non-admin) the halaqa is theirs.
  //   - Admins can either pick a teacher or leave unassigned.
  let teacherId: string | null = null
  if (isAdmin) {
    teacherId = body.teacher_id || null
    if (teacherId && platform === 'academy') {
      const check = await assertTeacherAssignable(teacherId)
      if (!check.ok) {
        return NextResponse.json({ error: check.message }, { status: 400 })
      }
    }
  } else {
    teacherId = session.sub
  }

  const description = body.description ? String(body.description).slice(0, 2000) : null
  const meetingLink = body.meeting_link ? String(body.meeting_link).slice(0, 500) : null
  const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at).toISOString() : null
  const durationMinutes = body.duration_minutes
    ? Math.max(5, Math.min(360, Number(body.duration_minutes)))
    : 60

  const inserted = await query<any>(
    `INSERT INTO halaqat (
       name, description, teacher_id, gender, max_students, meeting_link,
       platform, scheduled_at, duration_minutes, is_active, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW())
     RETURNING *`,
    [
      name,
      description,
      teacherId,
      gender,
      maxStudents,
      meetingLink,
      platform,
      scheduledAt,
      durationMinutes,
    ]
  )
  const row = inserted[0]
  if (row && !row.livekit_room_name) {
    const roomName = halaqaRoomName(row.id)
    await query(`UPDATE halaqat SET livekit_room_name = $1 WHERE id = $2`, [roomName, row.id])
    row.livekit_room_name = roomName
  }

  return NextResponse.json({ data: row }, { status: 201 })
}
