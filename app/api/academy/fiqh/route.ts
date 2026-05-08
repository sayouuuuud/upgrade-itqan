import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

const SUPERVISOR_ROLES = ["fiqh_supervisor", "supervisor", "admin", "academy_admin"]

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const view   = searchParams.get('view')   // 'mine' | 'public' | (default=public)
    const filter = searchParams.get('filter') // 'unanswered' | 'answered' | 'all'

    const isSupervisor = SUPERVISOR_ROLES.includes(session.role)

    let sql = ""
    const values: any[] = []

    if (view === 'mine') {
      // Student sees their own questions regardless of publish state
      sql = `
        SELECT f.*, u.name as student_name
        FROM fiqh_questions f
        LEFT JOIN users u ON u.id = f.asked_by
        WHERE f.asked_by = $1
        ORDER BY f.asked_at DESC
      `
      values.push(session.sub)

    } else if (isSupervisor) {
      // Supervisor sees ALL questions with filter support
      let where = "WHERE 1=1"
      if (filter === 'unanswered') where += " AND f.answer IS NULL"
      else if (filter === 'answered') where += " AND f.answer IS NOT NULL"

      sql = `
        SELECT
          f.*,
          CASE WHEN f.is_anonymous THEN 'مجهول الهوية' ELSE u.name END as student_name,
          ans.name as answered_by_name
        FROM fiqh_questions f
        LEFT JOIN users u ON u.id = f.asked_by
        LEFT JOIN users ans ON ans.id = f.answered_by
        ${where}
        ORDER BY f.asked_at DESC
      `

    } else {
      // Public: only published answered questions
      sql = `
        SELECT f.*,
          CASE WHEN f.is_anonymous THEN 'غير معروف' ELSE u.name END as student_name
        FROM fiqh_questions f
        LEFT JOIN users u ON u.id = f.asked_by
        WHERE f.is_published = TRUE AND f.answer IS NOT NULL
        ORDER BY f.answered_at DESC
      `
    }

    const questions = await query(sql, values)
    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Fiqh GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

// Supervisor answers a question
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || !SUPERVISOR_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const { id, answer, is_published } = await req.json()
    if (!id || !answer?.trim()) {
      return NextResponse.json({ error: "معرف السؤال والإجابة مطلوبان" }, { status: 400 })
    }

    const rows = await query(
      `UPDATE fiqh_questions
       SET answer = $1, answered_by = $2, answered_at = NOW(),
           is_published = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [answer.trim(), session.sub, is_published === true, id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 })
    }

    const answered = rows[0]

    // Notify the student that their question has been answered
    await createNotification({
      userId: answered.asked_by,
      type: 'general',
      title: 'تمت الإجابة على سؤالك الفقهي',
      message: `تمت الإجابة على سؤالك في فئة ${answered.category}. يمكنك الاطلاع عليها الآن.`,
      category: 'general',
      link: '/academy/student/fiqh',
    }).catch(() => {})

    // Also notify admins if the answer is published (for visibility)
    if (is_published) {
      const admins = await query<{ id: string }>(
        `SELECT id FROM users WHERE role IN ('admin','academy_admin') AND is_active = true`
      )
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'general',
          title: 'إجابة فقهية منشورة',
          message: `تمت إجابة سؤال ونشره في فئة ${answered.category}`,
          category: 'general',
          link: '/academy/admin/fiqh',
        }).catch(() => {})
      }
    }

    return NextResponse.json({ question: answered })
  } catch (error) {
    console.error("Fiqh PATCH error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { question, category, isAnonymous } = await req.json()

    if (!question || !category) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 })
    }

    const newQuestion = await query(
      `INSERT INTO fiqh_questions (asked_by, question, category, is_anonymous)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session.sub, question.trim(), category, isAnonymous === true]
    )

    return NextResponse.json({ question: newQuestion[0] })
  } catch (error) {
    console.error("Fiqh POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
