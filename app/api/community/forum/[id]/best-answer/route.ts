import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canModerate,
  isAuthor,
} from "@/lib/community/permissions"
import { createNotification } from "@/lib/notifications"
import type { Community } from "@/lib/community/types"

/**
 * POST /api/community/forum/[id]/best-answer
 * Body: { reply_id: string | null }
 *
 * Only the post author (typical case) or a moderator can mark a reply as the
 * best answer. Pass `reply_id: null` to clear.
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
  const post = await queryOne<{
    id: string
    community: Community
    author_id: string
    post_type: string
    title: string
  }>(
    `SELECT id, community, author_id, post_type, title FROM forum_posts WHERE id = $1`,
    [id]
  )
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }

  if (!canModerate(session, post.community) && !isAuthor(session, post.author_id)) {
    return NextResponse.json(
      { error: "فقط صاحب الموضوع أو المشرف يمكنه تحديد أفضل إجابة" },
      { status: 403 }
    )
  }

  let body: { reply_id?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const replyId = body.reply_id ?? null

  try {
    // Clear all current best-answer markers, then set the new one (if any).
    await query(
      `UPDATE forum_replies SET is_best_answer = FALSE WHERE post_id = $1`,
      [id]
    )

    if (replyId) {
      const updated = await query<{ id: string; author_id: string }>(
        `UPDATE forum_replies SET is_best_answer = TRUE
         WHERE id = $1 AND post_id = $2
         RETURNING id, author_id`,
        [replyId, id]
      )
      if (updated.length === 0) {
        return NextResponse.json(
          { error: "الرد غير موجود في هذا الموضوع" },
          { status: 404 }
        )
      }
      await query(
        `UPDATE forum_posts SET best_reply_id = $1, updated_at = NOW() WHERE id = $2`,
        [replyId, id]
      )
      if (updated[0].author_id !== session.sub) {
        createNotification({
          userId: updated[0].author_id,
          type: "general",
          title: "تم اختيار ردك كأفضل إجابة",
          message: `${session.name} اختار ردك كأفضل إجابة على: ${post.title}`,
          category: "general",
          link: `/academy/student/forum?post=${id}`,
        })
      }
    } else {
      await query(
        `UPDATE forum_posts SET best_reply_id = NULL, updated_at = NOW() WHERE id = $1`,
        [id]
      )
    }

    return NextResponse.json({ ok: true, best_reply_id: replyId })
  } catch (err) {
    console.error("[community/forum best-answer]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
