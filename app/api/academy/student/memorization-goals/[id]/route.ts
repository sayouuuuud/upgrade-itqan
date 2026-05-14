import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import type { MemorizationGoal } from "@/lib/memorization-goals"

/**
 * PATCH /api/academy/student/memorization-goals/:id
 *   { status: 'completed' | 'active' }   – mark the goal complete (or undo)
 *
 * Only the owning student may toggle the goal.  When marking complete we
 * also notify the teacher who set it (if any) so they can see the progress.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const nextStatus =
      body.status === "completed" || body.status === "active"
        ? body.status
        : null

    if (!nextStatus) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existing = await query<MemorizationGoal>(
      `SELECT * FROM memorization_goals WHERE id = $1 LIMIT 1`,
      [id],
    )
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (existing[0].student_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rows = await query<MemorizationGoal>(
      `UPDATE memorization_goals
         SET status       = $1,
             completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END,
             updated_at   = NOW()
       WHERE id = $2
       RETURNING *`,
      [nextStatus, id],
    )

    // Notify the teacher who set the goal (if any, and only on completion)
    if (nextStatus === "completed" && existing[0].set_by && existing[0].set_by !== session.sub) {
      const studentRows = await query<{ name: string }>(
        `SELECT name FROM users WHERE id = $1`,
        [session.sub],
      )
      const studentName = studentRows[0]?.name || "الطالب"

      await createNotification({
        userId: existing[0].set_by,
        type: "memorization_goal_completed",
        title: "تم إنجاز هدف الحفظ",
        message: `${studentName} أنجز هدف الحفظ الأسبوعي.`,
        category: "goal",
        link: `/academy/teacher/students/${session.sub}`,
        dedupKey: `mgoal:${id}:completed`,
      })
    }

    return NextResponse.json({ goal: rows[0] })
  } catch (err: any) {
    console.error("[API] memorization-goals PATCH error:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}

/** DELETE — student removes their goal. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const rows = await query<{ student_id: string }>(
      `SELECT student_id FROM memorization_goals WHERE id = $1 LIMIT 1`,
      [id],
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (rows[0].student_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await query(`DELETE FROM memorization_goals WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[API] memorization-goals DELETE error:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}
