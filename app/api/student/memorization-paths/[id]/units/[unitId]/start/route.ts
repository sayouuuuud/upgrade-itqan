import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// POST /api/student/memorization-paths/[id]/units/[unitId]/start
// Marks the unit progress as 'in_progress' (only if currently 'unlocked').
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

    let progressRows: any[]
    try {
      progressRows = (await query(
        `UPDATE memorization_path_progress p
            SET status = 'in_progress',
                started_at = COALESCE(started_at, NOW())
          FROM memorization_path_enrollments e
         WHERE p.enrollment_id = e.id
           AND e.path_id = $1
           AND e.student_id = $2
           AND p.unit_id = $3
           AND p.status IN ('unlocked', 'in_progress')
         RETURNING p.*`,
        [pathId, session.sub, unitId],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }

    if (progressRows.length === 0) {
      return NextResponse.json(
        { error: "الوحدة مغلقة أو غير متاحة" },
        { status: 403 },
      )
    }
    return NextResponse.json({ progress: progressRows[0] })
  } catch (err) {
    console.error("[student path start POST]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
