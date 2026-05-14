import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

/**
 * POST /api/community/forum/replies/[id]/like
 * Toggles a "like" on a reply. Idempotent: returns the new liked state.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const reply = await queryOne<{ id: string; community: Community }>(
    `SELECT r.id, p.community
     FROM forum_replies r
     JOIN forum_posts p ON p.id = r.post_id
     WHERE r.id = $1`,
    [id]
  )
  if (!reply) {
    return NextResponse.json({ error: "الرد غير موجود" }, { status: 404 })
  }
  if (!canAccessCommunity(session, reply.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const existing = await queryOne(
      `SELECT 1 FROM forum_reply_likes WHERE reply_id = $1 AND user_id = $2`,
      [id, session.sub]
    )
    if (existing) {
      await query(
        `DELETE FROM forum_reply_likes WHERE reply_id = $1 AND user_id = $2`,
        [id, session.sub]
      )
      return NextResponse.json({ liked: false })
    }
    await query(
      `INSERT INTO forum_reply_likes (reply_id, user_id) VALUES ($1, $2)`,
      [id, session.sub]
    )
    return NextResponse.json({ liked: true })
  } catch (err) {
    console.error("[forum reply like]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
