import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

/**
 * GET /api/halaqat/[id]/student-overview
 *
 * Returns the *personal* halaqa data for the current student:
 *   - their attendance log + computed stats
 *   - the halaqa's session history (with recordings when available)
 *
 * Accessible to the enrolled student, the halaqa owner, and platform admins
 * (so hosts/admins can preview the student experience).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqaRows = await query<{
    id: string
    teacher_id: string | null
    platform: HalaqaPlatform
  }>(
    `SELECT id, teacher_id, platform FROM halaqat WHERE id = $1`,
    [id],
  )
  const halaqa = halaqaRows[0]
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub

  // Resolve which student's data we're showing. For a student it's themselves;
  // admins/owners previewing simply see their own (likely empty) record.
  const studentId = session.sub

  if (!isAdmin && !isOwner) {
    const enr = await query<{ id: string }>(
      `SELECT id FROM halaqat_students
        WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
      [id, studentId],
    )
    if (enr.length === 0) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
  }

  const [attendance, sessions, enrollment] = await Promise.all([
    query<{
      id: string
      session_date: string
      status: string
      notes: string | null
    }>(
      `SELECT id, session_date, status, notes
         FROM halaqat_attendance
        WHERE halaqah_id = $1 AND student_id = $2
        ORDER BY session_date DESC
        LIMIT 60`,
      [id, studentId],
    ),
    query<{
      id: string
      started_at: string
      ended_at: string | null
      duration_seconds: number | null
      recording_status: string | null
      recording_url: string | null
      total_participants: number
    }>(
      `SELECT id, started_at, ended_at, duration_seconds,
              recording_status, recording_url, total_participants
         FROM video_sessions
        WHERE kind = 'halaqa' AND ref_id = $1
        ORDER BY started_at DESC
        LIMIT 30`,
      [id],
    ),
    query<{ joined_at: string }>(
      `SELECT joined_at FROM halaqat_students
        WHERE halaqah_id = $1 AND student_id = $2
        LIMIT 1`,
      [id, studentId],
    ),
  ])

  const total = attendance.length
  const present = attendance.filter((a) => a.status === 'present').length
  const late = attendance.filter((a) => a.status === 'late').length
  const absent = attendance.filter((a) => a.status === 'absent').length
  const excused = attendance.filter((a) => a.status === 'excused').length
  // Late still counts as "showed up" for the attendance rate.
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return NextResponse.json({
    joined_at: enrollment[0]?.joined_at ?? null,
    attendance,
    sessions,
    stats: {
      total,
      present,
      late,
      absent,
      excused,
      attendance_rate: attendanceRate,
      total_sessions_held: sessions.length,
    },
  })
}
