import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const FORUM_CATEGORIES = [
  'general', 'quran', 'fiqh', 'advice', 'youth', 'sisters',
  'announcements', 'questions', 'articles', 'guidance',
]

const PUBLISHER_CATEGORIES = ['articles', 'guidance']
const PUBLISHER_ROLES = ['teacher', 'admin', 'academy_admin', 'content_supervisor']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let sql = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar
      FROM forum_posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.is_approved = TRUE
    `
    const values: unknown[] = []

    if (category && category !== 'all') {
      values.push(category)
      sql += ` AND p.category = $${values.length}`
    }

    sql += ` ORDER BY p.is_pinned DESC, p.created_at DESC`

    const posts = await query(sql, values)
    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Forum GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { title, content, category } = await req.json()

    if (!title || !content || !category) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 })
    }

    if (!FORUM_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "تصنيف غير صالح" }, { status: 400 })
    }

    const canPublishEducationalContent =
      PUBLISHER_ROLES.includes(session.role) ||
      session.academy_roles?.some(role => PUBLISHER_ROLES.includes(role))

    if (PUBLISHER_CATEGORIES.includes(category) && !canPublishEducationalContent) {
      return NextResponse.json({ error: "هذا التصنيف مخصص للمدرسين والمشرفين" }, { status: 403 })
    }

    const newPost = await query(
      `INSERT INTO forum_posts (author_id, title, content, category, is_approved)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [session.sub, title.trim(), content.trim(), category]
    )

    return NextResponse.json({ post: newPost[0] })
  } catch (error) {
    console.error("Forum POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
