import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canModerate } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

/**
 * POST /api/community/forum/[id]/moderation
 * Body: { action: 'pin'|'unpin'|'lock'|'unlock'|'hide'|'unhide', reason? }
 *
 * Single endpoint for all moderator-only actions on a post. Cross-community
 * isolation is enforced — a moderator can only act inside their own community.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const post = await queryOne<{ id: string; community: Community }>(
    `SELECT id, community FROM forum_posts WHERE id = $1`,
    [id]
  )
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }
  if (!canModerate(session, post.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  let body: { action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  switch (body.action) {
    case "pin":
      await query(`UPDATE forum_posts SET is_pinned = TRUE, updated_at = NOW() WHERE id = $1`, [id])
      break
    case "unpin":
      await query(`UPDATE forum_posts SET is_pinned = FALSE, updated_at = NOW() WHERE id = $1`, [id])
      break
    case "lock":
      await query(`UPDATE forum_posts SET is_locked = TRUE, updated_at = NOW() WHERE id = $1`, [id])
      break
    case "unlock":
      await query(`UPDATE forum_posts SET is_locked = FALSE, updated_at = NOW() WHERE id = $1`, [id])
      break
    case "hide":
      await query(
        `UPDATE forum_posts
           SET is_hidden = TRUE,
               hidden_reason = $1,
               hidden_by = $2,
               hidden_at = NOW(),
               updated_at = NOW()
         WHERE id = $3`,
        [body.reason?.trim() || null, session.sub, id]
      )
      break
    case "unhide":
      await query(
        `UPDATE forum_posts
           SET is_hidden = FALSE,
               hidden_reason = NULL,
               hidden_by = NULL,
               hidden_at = NULL,
               updated_at = NOW()
         WHERE id = $1`,
        [id]
      )
      break
    default:
      return NextResponse.json(
        { error: "الإجراء غير معروف" },
        { status: 400 }
      )
  }

  return NextResponse.json({ ok: true })
}
