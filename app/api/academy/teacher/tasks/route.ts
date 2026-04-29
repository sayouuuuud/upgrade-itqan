import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !["teacher", "admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await query<any>(
      `
      SELECT 
        t.id,
        t.course_id,
        t.title,
        t.description,
        t.type,
        t.due_date,
        t.max_score,
        t.status,
        t.submission_instructions,
        t.created_at,
        c.title AS course_name,
        (SELECT COUNT(*)::int FROM task_submissions ts WHERE ts.task_id = t.id) AS submitted_count,
        (SELECT COUNT(*)::int FROM enrollments e 
           WHERE e.course_id = t.course_id 
           AND lower(e.status) = 'active') AS total_students
      FROM tasks t
      LEFT JOIN courses c ON c.id = t.course_id
      WHERE t.assigned_by = $1
         OR (t.course_id IS NOT NULL AND c.teacher_id = $1)
      ORDER BY t.created_at DESC
      `,
      [session.sub],
    )

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error("[API] Error fetching teacher tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !["teacher", "admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      course_id,
      title,
      description,
      task_type,
      submission_instructions,
      due_date,
      max_score,
    } = body

    if (!course_id || !title || !task_type || !due_date) {
      return NextResponse.json(
        {
          error:
            "البيانات المطلوبة ناقصة: الدورة، العنوان، نوع المهمة، وتاريخ التسليم",
        },
        { status: 400 },
      )
    }

    // Verify teacher owns the course
    const courseCheck = await query<any>(
      `SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`,
      [course_id, session.sub],
    )
    if (courseCheck.length === 0) {
      return NextResponse.json(
        { error: "هذه الدورة غير موجودة أو ليست من ضمن دوراتك" },
        { status: 403 },
      )
    }

    const dueDateIso = new Date(due_date)
    if (isNaN(dueDateIso.getTime())) {
      return NextResponse.json({ error: "تاريخ التسليم غير صحيح" }, { status: 400 })
    }

    const score = Number(max_score) || 100

    const result = await query<any>(
      `
      INSERT INTO tasks (
        course_id, assigned_by, title, description, type,
        submission_instructions, due_date, max_score, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
      RETURNING *
      `,
      [
        course_id,
        session.sub,
        title.trim(),
        description?.trim() || null,
        task_type,
        submission_instructions?.trim() || null,
        dueDateIso.toISOString(),
        score,
      ],
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error("[API] Error creating task:", error)
    return NextResponse.json(
      { error: error?.message || "حدث خطأ أثناء إنشاء المهمة" },
      { status: 500 },
    )
  }
}
