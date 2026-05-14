import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const article = await queryOne<{ community: Community; status: string }>(
    `SELECT community, status FROM articles WHERE id = $1`,
    [id]
  )
  if (!article) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
  }
  if (!canAccessCommunity(session, article.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const comments = await query(
    `SELECT c.id, c.article_id, c.author_id, c.content, c.is_hidden,
            c.created_at, c.updated_at,
            u.name AS author_name, u.avatar_url AS author_avatar
     FROM article_comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.article_id = $1 AND c.is_hidden = FALSE
     ORDER BY c.created_at ASC`,
    [id]
  )
  return NextResponse.json({ comments })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const article = await queryOne<{ community: Community; status: string }>(
    `SELECT community, status FROM articles WHERE id = $1`,
    [id]
  )
  if (!article || article.status !== "published") {
    return NextResponse.json({ error: "المقال غير متاح" }, { status: 404 })
  }
  if (!canAccessCommunity(session, article.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }
  const content = body.content?.trim()
  if (!content) {
    return NextResponse.json({ error: "التعليق فارغ" }, { status: 400 })
  }

  try {
    const rows = await query(
      `INSERT INTO article_comments (article_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, session.sub, content]
    )
    const comment = {
      ...rows[0],
      author_name: session.name,
    }
    return NextResponse.json({ comment }, { status: 201 })
  } catch (err) {
    console.error("[article comments POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
