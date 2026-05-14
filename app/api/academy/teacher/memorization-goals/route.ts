import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { getWeekStart, type MemorizationGoal } from "@/lib/memorization-goals"

/**
 * GET  /api/academy/teacher/memorization-goals
 *   ?student_id=...   – fetch the latest 12 weeks of goals for one student
 *   (no query)        – fetch this week's goal for every student in the
 *                       teacher's courses (for a "class overview")
 *
 * POST /api/academy/teacher/memorization-goals
 *   { student_id, week?, surah_from, ayah_from, surah_to, ayah_to,
 *     target_verses, notes }
 *   Creates / updates the weekly goal for one of the teacher's students.
 *   Sends an in-app notification to the student.
 */

async function ensureTeacherCanAccessStudent(
  teacherId: string,
  studentId: string,
): Promise<boolean> {
  // Teacher → student link is established via shared course enrollments.
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1
       FROM courses c
       JOIN enrollments e ON e.course_id = c.id
       WHERE c.teacher_id = $1 AND e.student_id = $2
     ) AS exists`,
    [teacherId, studentId],
  )
  return rows[0]?.exists === true
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("student_id")

    if (studentId) {
      if (!(await ensureTeacherCanAccessStudent(session.sub, studentId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const goals = await query<MemorizationGoal>(
        `SELECT g.*, s.name AS student_name
         FROM memorization_goals g
         JOIN users s ON s.id = g.student_id
         WHERE g.student_id = $1
         ORDER BY g.week_start DESC
         LIMIT 12`,
        [studentId],
      )
      return NextResponse.json({ goals })
    }

    const week = getWeekStart(new Date())
    const goals = await query<any>(
      `SELECT g.*, s.name AS student_name, s.email AS student_email
       FROM memorization_goals g
       JOIN users s ON s.id = g.student_id
       WHERE g.week_start = $1
         AND EXISTS (
           SELECT 1 FROM enrollments e
           JOIN courses c ON c.id = e.course_id
           WHERE e.student_id = g.student_id AND c.teacher_id = $2
         )
       ORDER BY s.name ASC`,
      [week, session.sub],
    )
    return NextResponse.json({ week_start: week, goals })
  } catch (err: any) {
    console.error("[API] teacher memorization-goals GET error:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const studentId = body.student_id?.toString()
    if (!studentId) {
      return NextResponse.json({ error: "student_id required" }, { status: 400 })
    }
    if (!(await ensureTeacherCanAccessStudent(session.sub, studentId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const week = body.week ? getWeekStart(body.week) : getWeekStart(new Date())
    const surahFrom = body.surah_from ?? null
    const ayahFrom = body.ayah_from ?? null
    const surahTo = body.surah_to ?? null
    const ayahTo = body.ayah_to ?? null
    const targetVerses = Math.max(0, parseInt(body.target_verses || "0", 10) || 0)
    const notes = (body.notes || "").toString().slice(0, 2000) || null

    const rows = await query<MemorizationGoal>(
      `INSERT INTO memorization_goals (
         student_id, set_by, week_start,
         surah_from, ayah_from, surah_to, ayah_to,
         target_verses, notes, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       ON CONFLICT (student_id, week_start) DO UPDATE SET
         set_by        = EXCLUDED.set_by,
         surah_from    = EXCLUDED.surah_from,
         ayah_from     = EXCLUDED.ayah_from,
         surah_to      = EXCLUDED.surah_to,
         ayah_to       = EXCLUDED.ayah_to,
         target_verses = EXCLUDED.target_verses,
         notes         = EXCLUDED.notes,
         status        = 'active',
         completed_at  = NULL,
         updated_at    = NOW()
       RETURNING *`,
      [
        studentId, session.sub, week,
        surahFrom, ayahFrom, surahTo, ayahTo,
        targetVerses, notes,
      ],
    )

    // Tell the student a new goal was set
    const teacherRows = await query<{ name: string }>(
      `SELECT name FROM users WHERE id = $1`,
      [session.sub],
    )
    const teacherName = teacherRows[0]?.name || "المدرس"

    await createNotification({
      userId: studentId,
      type: "memorization_goal_set",
      title: "هدف حفظ أسبوعي جديد",
      message: `حدّد لك ${teacherName} هدف الحفظ لهذا الأسبوع.`,
      category: "goal",
      link: `/academy/student/memorization/goal`,
      dedupKey: `mgoal:set:${rows[0].id}:${week}`,
    })

    return NextResponse.json({ goal: rows[0] })
  } catch (err: any) {
    console.error("[API] teacher memorization-goals POST error:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}
