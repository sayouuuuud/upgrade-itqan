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
  if (!halaqa) return { halaqa: null, sessionExists: false }
  const sess = await queryOne<{ id: string }>(
    `SELECT id FROM halaqa_sessions WHERE id = $1 AND halaqah_id = $2`,
    [sessionId, halaqaId]
  )
  return { halaqa, sessionExists: !!sess }
}

function canManage(user: { sub: string; role: string }, halaqa: HalaqaShort) {
  return ADMIN_ROLES[halaqa.platform].includes(user.role) || halaqa.teacher_id === user.sub
}

function clampScore(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return Math.max(0, Math.min(10, Math.round(n)))
}

const ATT_STATUSES = new Set(['present', 'absent', 'late', 'excused'])
const VERDICTS = new Set(['excellent', 'passed', 'needs_work', 'repeat'])

/**
 * POST /api/halaqat/[id]/sessions/[sessionId]/roster
 *
 * Host/admin upserts a student's attendance and/or evaluation for the session.
 * Body: { student_id, attendance_status?, evaluation?: { memorization_score, tajweed_score,
 *         fluency_score, verdict, strengths, notes, next_surah_*, next_ayah_*, next_wird_note } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, sessionId } = await params

  const { halaqa, sessionExists } = await loadContext(id, sessionId)
  if (!halaqa || !sessionExists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!canManage(user, halaqa)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const studentId = String(body.student_id || '')
  if (!studentId) return NextResponse.json({ error: 'student_id مطلوب' }, { status: 400 })

  // The student must be enrolled in this halaqa.
  const enrolled = await queryOne<{ id: string }>(
    `SELECT id FROM halaqat_students WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
    [id, studentId]
  )
  if (!enrolled) return NextResponse.json({ error: 'الطالب غير مشترك في الحلقة' }, { status: 400 })

  // --- Attendance upsert ---
  if (body.attendance_status !== undefined) {
    const status = String(body.attendance_status)
    if (!ATT_STATUSES.has(status)) {
      return NextResponse.json({ error: 'حالة حضور غير صحيحة' }, { status: 400 })
    }
    await query(
      `INSERT INTO halaqa_session_attendance (session_id, student_id, status, source, created_at, updated_at)
       VALUES ($1, $2, $3, 'manual', NOW(), NOW())
       ON CONFLICT (session_id, student_id)
       DO UPDATE SET status = EXCLUDED.status, source = 'manual', updated_at = NOW()`,
      [sessionId, studentId, status]
    )
  }

  // --- Evaluation upsert ---
  const ev = body.evaluation
  if (ev && typeof ev === 'object') {
    const verdict = ev.verdict && VERDICTS.has(String(ev.verdict)) ? String(ev.verdict) : null
    await query(
      `INSERT INTO halaqa_session_evaluations
         (session_id, student_id, memorization_score, tajweed_score, fluency_score,
          verdict, strengths, notes, next_surah_number, next_surah_name,
          next_ayah_from, next_ayah_to, next_wird_note, evaluated_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
       ON CONFLICT (session_id, student_id) DO UPDATE SET
         memorization_score = EXCLUDED.memorization_score,
         tajweed_score = EXCLUDED.tajweed_score,
         fluency_score = EXCLUDED.fluency_score,
         verdict = EXCLUDED.verdict,
         strengths = EXCLUDED.strengths,
         notes = EXCLUDED.notes,
         next_surah_number = EXCLUDED.next_surah_number,
         next_surah_name = EXCLUDED.next_surah_name,
         next_ayah_from = EXCLUDED.next_ayah_from,
         next_ayah_to = EXCLUDED.next_ayah_to,
         next_wird_note = EXCLUDED.next_wird_note,
         evaluated_by = EXCLUDED.evaluated_by,
         updated_at = NOW()`,
      [
        sessionId,
        studentId,
        clampScore(ev.memorization_score),
        clampScore(ev.tajweed_score),
        clampScore(ev.fluency_score),
        verdict,
        ev.strengths ? String(ev.strengths).slice(0, 1000) : null,
        ev.notes ? String(ev.notes).slice(0, 2000) : null,
        ev.next_surah_number ?? null,
        ev.next_surah_name ?? null,
        ev.next_ayah_from ?? null,
        ev.next_ayah_to ?? null,
        ev.next_wird_note ? String(ev.next_wird_note).slice(0, 1000) : null,
        user.sub,
      ]
    )
  }

  return NextResponse.json({ success: true })
}
