import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

interface HalaqaShort {
  id: string
  teacher_id: string | null
  platform: HalaqaPlatform
}

async function loadHalaqaShort(id: string) {
  return queryOne<HalaqaShort>(
    `SELECT id, teacher_id, platform FROM halaqat WHERE id = $1`,
    [id]
  )
}

function canManage(session: { sub: string; role: string }, halaqa: HalaqaShort) {
  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  return isAdmin || isOwner
}

async function isEnrolled(halaqaId: string, studentId: string) {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM halaqat_students WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
    [halaqaId, studentId]
  )
  return !!row
}

/**
 * GET /api/halaqat/[id]/sessions
 * List all scheduled/past sessions of a halaqa with attendance + evaluation
 * counts. Host/admins see everything; enrolled students see the list too.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const manage = canManage(session, halaqa)
  if (!manage && !(await isEnrolled(id, session.sub))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const sessions = await query<any>(
    `SELECT
       s.*,
       (SELECT COUNT(*) FROM halaqa_session_attendance a
         WHERE a.session_id = s.id AND a.status = 'present')::int AS present_count,
       (SELECT COUNT(*) FROM halaqa_session_evaluations e
         WHERE e.session_id = s.id)::int AS evaluation_count
     FROM halaqa_sessions s
     WHERE s.halaqah_id = $1
     ORDER BY s.scheduled_at DESC NULLS LAST, s.created_at DESC`,
    [id]
  )

  return NextResponse.json({ sessions, can_manage: manage })
}

/**
 * POST /api/halaqat/[id]/sessions
 * Create a scheduled session. Host/admin only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })
  if (!canManage(session, halaqa)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: 'عنوان الجلسة مطلوب' }, { status: 400 })
  }

  const row = await queryOne<any>(
    `INSERT INTO halaqa_sessions
       (halaqah_id, title, description, agenda, scheduled_at, duration_minutes,
        surah_name, surah_number, ayah_from, ayah_to, juz_number, wird_note,
        status, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'scheduled',$13,NOW(),NOW())
     RETURNING *`,
    [
      id,
      String(body.title).trim(),
      body.description ?? null,
      body.agenda ?? null,
      body.scheduled_at ?? null,
      body.duration_minutes ?? null,
      body.surah_name ?? null,
      body.surah_number ?? null,
      body.ayah_from ?? null,
      body.ayah_to ?? null,
      body.juz_number ?? null,
      body.wird_note ?? null,
      session.sub,
    ]
  )

  return NextResponse.json({ session: row }, { status: 201 })
}
