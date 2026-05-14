import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/student/memorization-paths/[id]
// Returns:
//   { path, units: [{ ...unit, progress: {...} | null }], enrollment }
// Each unit has its progress row attached if the student is enrolled.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { id } = await ctx.params

    let pathRows: any[]
    try {
      pathRows = (await query(
        `SELECT * FROM memorization_paths WHERE id = $1 AND is_active = TRUE LIMIT 1`,
        [id],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }
    const path = pathRows[0]
    if (!path) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 })
    }

    const units = (await query(
      `SELECT * FROM memorization_path_units WHERE path_id = $1 ORDER BY position ASC`,
      [id],
    )) as any[]

    const enrollmentRows = (await query(
      `SELECT * FROM memorization_path_enrollments
        WHERE path_id = $1 AND student_id = $2 LIMIT 1`,
      [id, session.sub],
    )) as any[]
    const enrollment = enrollmentRows[0] || null

    let unitsWithProgress = units.map(u => ({ ...u, progress: null as any }))
    if (enrollment) {
      const progressRows = (await query(
        `SELECT * FROM memorization_path_progress WHERE enrollment_id = $1`,
        [enrollment.id],
      )) as any[]
      const byUnit: Record<string, any> = {}
      for (const p of progressRows) byUnit[p.unit_id] = p
      unitsWithProgress = units.map(u => ({ ...u, progress: byUnit[u.id] || null }))
    } else {
      // Not enrolled: mark every unit as 'locked' (preview)
      unitsWithProgress = units.map(u => ({
        ...u,
        progress: { status: "locked" as const, recitation_id: null, audio_url: null },
      }))
    }

    return NextResponse.json({
      path,
      units: unitsWithProgress,
      enrollment,
    })
  } catch (err) {
    console.error("[student path GET]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
