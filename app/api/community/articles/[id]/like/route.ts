import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const article = await queryOne<{ id: string; community: Community; status: string }>(
    `SELECT id, community, status FROM articles WHERE id = $1`,
    [id]
  )
  if (!article || article.status !== "published") {
    return NextResponse.json({ error: "المقال غير متاح" }, { status: 404 })
  }
  if (!canAccessCommunity(session, article.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const existing = await queryOne(
      `SELECT 1 FROM article_likes WHERE article_id = $1 AND user_id = $2`,
      [id, session.sub]
    )
    if (existing) {
      await query(
        `DELETE FROM article_likes WHERE article_id = $1 AND user_id = $2`,
        [id, session.sub]
      )
      return NextResponse.json({ liked: false })
    }
    await query(
      `INSERT INTO article_likes (article_id, user_id) VALUES ($1, $2)`,
      [id, session.sub]
    )
    return NextResponse.json({ liked: true })
  } catch (err) {
    console.error("[article like]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
