import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const ROLES = ["teacher", "admin", "academy_admin"]

// Verify the task exists and belongs to this teacher (owner of the course or assigner).
async function getOwnedTask(taskId: string, userId: string) {
  const rows = await query<any>(
    `
    SELECT t.*
    FROM tasks t
    LEFT JOIN courses c ON c.id = t.course_id
    WHERE t.id = $1
      AND (t.assigned_by = $2 OR c.teacher_id = $2)
    LIMIT 1
    `,
    [taskId, userId],
  )
  return rows[0] || null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || !ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const task = await getOwnedTask(id, session.sub)
    if (!task) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 })
    }
    return NextResponse.json({ data: task })
  } catch (error) {
    console.error("[API] Error fetching task:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || !ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const task = await getOwnedTask(id, session.sub)
    if (!task) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 })
    }

    const body = await req.json()
    const { title, description, submission_instructions, due_date, max_score, status } = body

    // Build a dynamic update so the teacher can patch any subset of fields.
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    if (title !== undefined) {
      if (!String(title).trim()) {
        return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })
      }
      sets.push(`title = $${i++}`)
      values.push(String(title).trim())
    }
    if (description !== undefined) {
      sets.push(`description = $${i++}`)
      values.push(description?.trim() || null)
    }
    if (submission_instructions !== undefined) {
      sets.push(`submission_instructions = $${i++}`)
      values.push(submission_instructions?.trim() || null)
    }
    if (due_date !== undefined) {
      const d = new Date(due_date)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "تاريخ التسليم غير صحيح" }, { status: 400 })
      }
      sets.push(`due_date = $${i++}`)
      values.push(d.toISOString())
    }
    // Quizzes keep their auto-computed score; only allow editing for non-quiz tasks.
    if (max_score !== undefined && task.type !== "quiz") {
      sets.push(`max_score = $${i++}`)
      values.push(Number(max_score) || 100)
    }
    if (status !== undefined) {
      const allowed = ["pending", "active", "closed", "graded"]
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 })
      }
      sets.push(`status = $${i++}`)
      values.push(status)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 })
    }

    sets.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query<any>(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    )

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error: any) {
    console.error("[API] Error updating task:", error)
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || !ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const task = await getOwnedTask(id, session.sub)
    if (!task) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 })
    }

    // task_submissions cascade on delete via FK.
    await query(`DELETE FROM tasks WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API] Error deleting task:", error)
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    )
  }
}
