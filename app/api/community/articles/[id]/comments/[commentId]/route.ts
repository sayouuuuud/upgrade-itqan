import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canModerate,
  isAuthor,
} from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { commentId } = await params
  const row = await queryOne<{
    id: string
    author_id: string
    community: Community
  }>(
    `SELECT c.id, c.author_id, a.community
     FROM article_comments c
     JOIN articles a ON a.id = c.article_id
     WHERE c.id = $1`,
    [commentId]
  )
  if (!row) {
    return NextResponse.json({ error: "التعليق غير موجود" }, { status: 404 })
  }
  if (!isAuthor(session, row.author_id) && !canModerate(session, row.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  try {
    await query(`DELETE FROM article_comments WHERE id = $1`, [commentId])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[article comment DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
