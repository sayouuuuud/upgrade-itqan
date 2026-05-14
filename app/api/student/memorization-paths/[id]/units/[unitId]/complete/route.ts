import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// POST /api/student/memorization-paths/[id]/units/[unitId]/complete
// Body: { audio_url?: string, audio_duration_seconds?: number, notes?: string, recitation_id?: string }
//
// Behaviour:
//   1. Reject if unit is locked (sequential gating: prev units must be done first).
//   2. If require_audio is true on the path, audio_url or recitation_id must be provided.
//   3. Mark unit as completed; set started_at if missing; set completed_at = NOW().
//   4. Unlock next unit (if any).
//   5. Update enrollment.units_completed, current_unit_id, last_activity_at.
//   6. If this was the last unit, set enrollment.status='completed', completed_at=NOW().
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; unitId: string }> },
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { id: pathId, unitId } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as {
      audio_url?: string
      audio_duration_seconds?: number
      notes?: string
      recitation_id?: string
    }

    // 1. enrollment
    let enrollmentRows: any[]
    try {
      enrollmentRows = (await query(
        `SELECT e.*, p.require_audio, p.total_units
           FROM memorization_path_enrollments e
           JOIN memorization_paths p ON p.id = e.path_id
          WHERE e.path_id = $1 AND e.student_id = $2 LIMIT 1`,
        [pathId, session.sub],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }
    const enrollment = enrollmentRows[0]
    if (!enrollment) {
      return NextResponse.json({ error: "غير مشترك في المسار" }, { status: 404 })
    }
    if (enrollment.status === "completed") {
      return NextResponse.json({ error: "المسار مكتمل بالفعل" }, { status: 409 })
    }

    // 2. unit + current progress
    const unitRows = (await query(
      `SELECT u.id, u.position
         FROM memorization_path_units u
        WHERE u.id = $1 AND u.path_id = $2 LIMIT 1`,
      [unitId, pathId],
    )) as any[]
    const unit = unitRows[0]
    if (!unit) {
      return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 })
    }

    const progressRows = (await query(
      `SELECT * FROM memorization_path_progress
        WHERE enrollment_id = $1 AND unit_id = $2 LIMIT 1`,
      [enrollment.id, unit.id],
    )) as any[]
    const progress = progressRows[0]
    if (!progress) {
      return NextResponse.json({ error: "لا يوجد تقدم لهذه الوحدة" }, { status: 404 })
    }

    if (progress.status === "locked") {
      return NextResponse.json(
        { error: "هذه الوحدة مغلقة — يجب إتمام الوحدة السابقة أولاً" },
        { status: 403 },
      )
    }

    if (progress.status === "completed") {
      return NextResponse.json({ progress }, { status: 200 })
    }

    // 3. audio requirement
    if (enrollment.require_audio && !body.audio_url && !body.recitation_id && !progress.audio_url && !progress.recitation_id) {
      return NextResponse.json(
        { error: "هذا المسار يتطلب تسجيل صوتي قبل إتمام الوحدة" },
        { status: 400 },
      )
    }

    // 4. mark progress as completed
    const updated = (await query<any>(
      `UPDATE memorization_path_progress
          SET status      = 'completed',
              audio_url   = COALESCE($1, audio_url),
              audio_duration_seconds = COALESCE($2, audio_duration_seconds),
              recitation_id = COALESCE($3, recitation_id),
              notes       = COALESCE($4, notes),
              started_at  = COALESCE(started_at, NOW()),
              completed_at = NOW()
        WHERE id = $5
        RETURNING *`,
      [
        body.audio_url || null,
        body.audio_duration_seconds || null,
        body.recitation_id || null,
        body.notes || null,
        progress.id,
      ],
    )) as any[]

    // 5. unlock next unit (by position)
    const nextUnitRows = (await query(
      `SELECT id, position FROM memorization_path_units
        WHERE path_id = $1 AND position > $2
        ORDER BY position ASC LIMIT 1`,
      [pathId, unit.position],
    )) as any[]
    const nextUnit = nextUnitRows[0] || null

    if (nextUnit) {
      await query(
        `UPDATE memorization_path_progress
            SET status = 'unlocked'
          WHERE enrollment_id = $1 AND unit_id = $2 AND status = 'locked'`,
        [enrollment.id, nextUnit.id],
      )
    }

    // 6. update enrollment counters
    const completedCountRows = (await query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
         FROM memorization_path_progress
        WHERE enrollment_id = $1 AND status = 'completed'`,
      [enrollment.id],
    )) as any[]
    const completedCount = parseInt(completedCountRows[0]?.c || "0", 10)
    const totalUnits = parseInt(enrollment.total_units || "0", 10) || 0

    const isFinished = totalUnits > 0 && completedCount >= totalUnits

    const updatedEnrollment = (await query<any>(
      `UPDATE memorization_path_enrollments
          SET units_completed   = $1,
              current_unit_id   = $2,
              last_activity_at  = NOW(),
              status            = CASE WHEN $3::boolean THEN 'completed' ELSE status END,
              completed_at      = CASE WHEN $3::boolean AND completed_at IS NULL THEN NOW() ELSE completed_at END
        WHERE id = $4
      RETURNING *`,
      [completedCount, nextUnit?.id || null, isFinished, enrollment.id],
    )) as any[]

    return NextResponse.json({
      progress: updated[0],
      next_unit_id: nextUnit?.id || null,
      enrollment: updatedEnrollment[0],
      finished: isFinished,
    })
  } catch (err: any) {
    console.error("[student path complete POST]", err)
    return NextResponse.json({ error: err?.message || "حدث خطأ" }, { status: 500 })
  }
}
