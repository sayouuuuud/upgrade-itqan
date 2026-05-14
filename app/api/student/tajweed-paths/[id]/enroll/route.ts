import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { isTargetAllowedForStudent } from "@/lib/academy/parent-controls"

// POST /api/student/tajweed-paths/[id]/enroll
// Creates enrollment row + seeds progress rows for all stages.
// First stage = 'unlocked', rest = 'locked'.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["student"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params

    const decision = await isTargetAllowedForStudent(session!.sub, "tajweed_path", id)
    if (!decision.allowed) {
      return NextResponse.json({ error: "هذا المسار غير مسموح لهذا الحساب بواسطة ولي الأمر" }, { status: 403 })
    }

    let pathRows: any[]
    try {
      pathRows = (await query<any>(
        `SELECT * FROM tajweed_paths
          WHERE id = $1 AND is_published = TRUE AND is_active = TRUE LIMIT 1`,
        [id],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      throw err
    }
    const path = pathRows[0]
    if (!path) return NextResponse.json({ error: "غير موجود أو غير منشور" }, { status: 404 })

    const stages = (await query<any>(
      `SELECT id FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
      [id],
    )) as any[]
    if (stages.length === 0) return NextResponse.json({ error: "لا توجد مراحل" }, { status: 400 })

    const existing = (await query<any>(
      `SELECT id, status FROM tajweed_path_enrollments
        WHERE path_id = $1 AND student_id = $2 LIMIT 1`,
      [id, session!.sub],
    )) as any[]
    if (existing[0]) {
      // Reactivate if dropped
      if (existing[0].status === "dropped") {
        await query(
          `UPDATE tajweed_path_enrollments SET status = 'active', last_activity_at = NOW() WHERE id = $1`,
          [existing[0].id],
        )
      }
      return NextResponse.json({ enrollment_id: existing[0].id, reused: true })
    }

    const firstStageId = stages[0].id
    const enrollmentRows = (await query<any>(
      `INSERT INTO tajweed_path_enrollments (path_id, student_id, current_stage_id, status)
       VALUES ($1, $2, $3, 'active') RETURNING *`,
      [id, session!.sub, firstStageId],
    )) as any[]
    const enrollment = enrollmentRows[0]

    // Seed progress rows
    const values: any[] = []
    const placeholders: string[] = []
    let i = 1
    stages.forEach((s: any, idx: number) => {
      placeholders.push(`($${i++}, $${i++}, $${i++})`)
      values.push(enrollment.id, s.id, idx === 0 ? "unlocked" : "locked")
    })
    await query(
      `INSERT INTO tajweed_path_progress (enrollment_id, stage_id, status) VALUES ${placeholders.join(", ")}`,
      values,
    )

    return NextResponse.json({ enrollment_id: enrollment.id, status: "active" }, { status: 201 })
  } catch (err) {
    console.error("[student tajweed enroll]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["student"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    await query(
      `UPDATE tajweed_path_enrollments SET status = 'dropped'
        WHERE path_id = $1 AND student_id = $2 AND status <> 'completed'`,
      [id, session!.sub],
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[student tajweed enroll DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
