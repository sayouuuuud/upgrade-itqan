import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

interface HalaqaShort {
  id: string
  teacher_id: string | null
  platform: HalaqaPlatform
}

async function loadContext(halaqaId: string, sessionId: string) {
  const halaqa = await queryOne<HalaqaShort>(
    `SELECT id, teacher_id, platform FROM halaqat WHERE id = $1`,
    [halaqaId]
  )
  if (!halaqa) return { halaqa: null, session: null }
  const sess = await queryOne<any>(
    `SELECT * FROM halaqa_sessions WHERE id = $1 AND halaqah_id = $2`,
    [sessionId, halaqaId]
  )
  return { halaqa, session: sess }
}

function canManage(user: { sub: string; role: string }, halaqa: HalaqaShort) {
  return ADMIN_ROLES[halaqa.platform].includes(user.role) || halaqa.teacher_id === user.sub
}

/**
 * GET /api/halaqat/[id]/sessions/[sessionId]
 * Returns the session plus the roster (enrolled students) with their
 * attendance status and existing evaluation for this session.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, sessionId } = await params

  const { halaqa, session: sess } = await loadContext(id, sessionId)
  if (!halaqa || !sess) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  const manage = canManage(user, halaqa)
  if (!manage) {
    const enr = await queryOne<{ id: string }>(
      `SELECT id FROM halaqat_students WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
      [id, user.sub]
    )
    if (!enr) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Roster: enrolled students + their attendance + evaluation for THIS session.
  const roster = await query<any>(
    `SELECT
       u.id AS student_id,
       u.name AS student_name,
       u.email AS student_email,
       u.avatar_url,
       att.status AS attendance_status,
       att.joined_at,
       att.duration_minutes,
       ev.id AS evaluation_id,
       ev.memorization_score,
       ev.tajweed_score,
       ev.fluency_score,
       ev.verdict,
       ev.strengths,
       ev.notes,
       ev.next_surah_name,
       ev.next_surah_number,
       ev.next_ayah_from,
       ev.next_ayah_to,
       ev.next_wird_note
     FROM halaqat_students hs
     JOIN users u ON u.id = hs.student_id
     LEFT JOIN halaqa_session_attendance att
       ON att.session_id = $2 AND att.student_id = u.id
     LEFT JOIN halaqa_session_evaluations ev
       ON ev.session_id = $2 AND ev.student_id = u.id
     WHERE hs.halaqah_id = $1 AND hs.is_active = TRUE
     ORDER BY u.name`,
    [id, sessionId]
  )

  // A non-managing student only sees their own row.
  const visibleRoster = manage ? roster : roster.filter((r) => r.student_id === user.sub)

  return NextResponse.json({ session: sess, roster: visibleRoster, can_manage: manage })
}

/**
 * PATCH /api/halaqat/[id]/sessions/[sessionId]
 * Update session fields (title, schedule, wird, status, recording…). Host/admin only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, sessionId } = await params

  const { halaqa, session: sess } = await loadContext(id, sessionId)
  if (!halaqa || !sess) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!canManage(user, halaqa)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const fields: Array<[string, any]> = [
    ['title', body.title !== undefined ? String(body.title).trim() : undefined],
    ['description', body.description],
    ['agenda', body.agenda],
    ['scheduled_at', body.scheduled_at],
    ['duration_minutes', body.duration_minutes],
    ['surah_name', body.surah_name],
    ['surah_number', body.surah_number],
    ['ayah_from', body.ayah_from],
    ['ayah_to', body.ayah_to],
    ['juz_number', body.juz_number],
    ['wird_note', body.wird_note],
    ['recording_url', body.recording_url],
    ['status', body.status],
  ]

  const updates: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const [col, val] of fields) {
    if (val !== undefined) {
      updates.push(`${col} = $${i++}`)
      values.push(val)
    }
  }

  // Track lifecycle timestamps on status change.
  if (body.status === 'live') updates.push(`started_at = COALESCE(started_at, NOW())`)
  if (body.status === 'ended') updates.push(`ended_at = COALESCE(ended_at, NOW())`)

  if (updates.length === 0) return NextResponse.json({ session: sess })

  updates.push(`updated_at = NOW()`)
  values.push(sessionId)
  const row = await queryOne<any>(
    `UPDATE halaqa_sessions SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  return NextResponse.json({ session: row })
}

/**
 * DELETE /api/halaqat/[id]/sessions/[sessionId] — host/admin only.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, sessionId } = await params

  const { halaqa, session: sess } = await loadContext(id, sessionId)
  if (!halaqa || !sess) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!canManage(user, halaqa)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  await query(`DELETE FROM halaqa_sessions WHERE id = $1`, [sessionId])
  return NextResponse.json({ success: true })
}
