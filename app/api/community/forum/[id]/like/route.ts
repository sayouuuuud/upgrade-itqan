import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import { isUserBanned } from "@/lib/community/bans"
import type { Community } from "@/lib/community/types"

/**
 * POST /api/community/forum/[id]/like
 * Toggles the current user's upvote on the post. Trigger keeps
 * forum_posts.upvotes_count in sync.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const post = await queryOne<{ id: string; community: Community; is_hidden: boolean; is_approved: boolean }>(
    `SELECT id, community, is_hidden, is_approved FROM forum_posts WHERE id = $1`,
    [id]
  )
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }
  if (!canAccessCommunity(session, post.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  if (post.is_hidden || !post.is_approved) {
    return NextResponse.json(
      { error: "لا يمكن التصويت على هذا المنشور" },
      { status: 403 }
    )
  }
  if (await isUserBanned(session.sub, post.community)) {
    return NextResponse.json(
      { error: "أنت محظور من هذا المجتمع" },
      { status: 403 }
    )
  }

  const existing = await queryOne(
    `SELECT 1 FROM forum_post_likes WHERE post_id = $1 AND user_id = $2`,
    [id, session.sub]
  )

  try {
    if (existing) {
      await query(
        `DELETE FROM forum_post_likes WHERE post_id = $1 AND user_id = $2`,
        [id, session.sub]
      )
      const row = await queryOne<{ upvotes_count: number }>(
        `SELECT upvotes_count FROM forum_posts WHERE id = $1`,
        [id]
      )
      return NextResponse.json({
        liked: false,
        upvotes_count: row?.upvotes_count ?? 0,
      })
    } else {
      await query(
        `INSERT INTO forum_post_likes (post_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [id, session.sub]
      )
      const row = await queryOne<{ upvotes_count: number }>(
        `SELECT upvotes_count FROM forum_posts WHERE id = $1`,
        [id]
      )
      return NextResponse.json({
        liked: true,
        upvotes_count: row?.upvotes_count ?? 0,
      })
    }
  } catch (err) {
    console.error("[community/forum/[id]/like]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
