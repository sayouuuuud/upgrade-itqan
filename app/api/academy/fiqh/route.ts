import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view') // 'all' or 'mine'

    let sql = ""
    const values: any[] = []

    if (view === 'mine') {
      sql = `
        SELECT f.*, u.name as student_name
        FROM fiqh_questions f
        JOIN users u ON u.id = f.asked_by
        WHERE f.asked_by = $1
        ORDER BY f.asked_at DESC
      `
      values.push(session.sub)
    } else {
      sql = `
        SELECT f.*,
          CASE WHEN f.is_anonymous THEN 'غير معروف' ELSE u.name END as student_name
        FROM fiqh_questions f
        JOIN users u ON u.id = f.asked_by
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
