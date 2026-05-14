import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { isTargetAllowedForStudent } from "@/lib/academy/parent-controls"

// POST /api/student/memorization-paths/[id]/enroll
// Enroll the current student in this path.  Creates progress rows for every
// unit; unit at position 1 is 'unlocked', the rest start as 'locked'.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { id } = await ctx.params

    const decision = await isTargetAllowedForStudent(session.sub, "memorization_path", id)
    if (!decision.allowed) {
      return NextResponse.json({ error: "هذا المسار غير مسموح لهذا الحساب بواسطة ولي الأمر" }, { status: 403 })
    }

    // 1. verify path is published & active
    let pathRows: any[]
    try {
      pathRows = (await query(
        `SELECT id, total_units FROM memorization_paths
          WHERE id = $1 AND is_active = TRUE AND is_published = TRUE LIMIT 1`,
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
      return NextResponse.json({ error: "المسار غير متاح" }, { status: 404 })
    }

    // 2. fetch ordered units
    const units = (await query<{ id: string; position: number }>(
      `SELECT id, position FROM memorization_path_units WHERE path_id = $1 ORDER BY position ASC`,
      [id],
    )) as any[]
    if (units.length === 0) {
      return NextResponse.json({ error: "المسار فارغ — لا يحتوي على وحدات" }, { status: 400 })
    }

    // 3. upsert enrollment
    const enrollment = (await query<any>(
      `INSERT INTO memorization_path_enrollments (path_id, student_id, status, current_unit_id)
         VALUES ($1, $2, 'active', $3)
       ON CONFLICT (path_id, student_id) DO UPDATE SET
         status = CASE
           WHEN memorization_path_enrollments.status = 'completed' THEN 'completed'
           ELSE 'active'
         END,
         last_activity_at = NOW()
       RETURNING *`,
      [id, session.sub, units[0].id],
    )) as any[]

    // 4. seed progress rows (skip ones that already exist)
    const placeholders: string[] = []
    const params: any[] = []
    let i = 1
    for (const u of units) {
      const status = u.position === 1 ? "unlocked" : "locked"
      placeholders.push(`($${i++}, $${i++}, $${i++})`)
      params.push(enrollment[0].id, u.id, status)
    }
    await query(
      `INSERT INTO memorization_path_progress (enrollment_id, unit_id, status)
         VALUES ${placeholders.join(", ")}
       ON CONFLICT (enrollment_id, unit_id) DO NOTHING`,
      params,
    )

    return NextResponse.json({ enrollment: enrollment[0] }, { status: 201 })
  } catch (err: any) {
    console.error("[student path enroll POST]", err)
    return NextResponse.json({ error: err?.message || "حدث خطأ" }, { status: 500 })
  }
}

// DELETE /api/student/memorization-paths/[id]/enroll
// Drop the enrollment (status='dropped') without removing progress rows.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { id } = await ctx.params

    await query(
      `UPDATE memorization_path_enrollments
          SET status = 'dropped', last_activity_at = NOW()
        WHERE path_id = $1 AND student_id = $2`,
      [id, session.sub],
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[student path enroll DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
