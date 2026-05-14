import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canAccessCommunity,
  canModerate,
  isAuthor,
} from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

interface PostRow {
  id: string
  author_id: string
  community: Community
  post_type: string
  title: string
  content: string
  category: string
  tags: string[]
  is_pinned: boolean
  is_locked: boolean
  is_hidden: boolean
  is_approved: boolean
  best_reply_id: string | null
  views_count: number
  replies_count: number
  last_reply_at: string | null
  created_at: string
  updated_at: string
}

async function loadPost(id: string) {
  return queryOne<PostRow & {
    author_name: string
    author_avatar: string | null
    author_role: string
  }>(
    `SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role
     FROM forum_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.id = $1`,
    [id]
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const post = await loadPost(id)
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }

  if (!canAccessCommunity(session, post.community)) {
    return NextResponse.json(
      { error: "لا تملك صلاحية الوصول لهذا المجتمع" },
      { status: 403 }
    )
  }

  const showHidden = canModerate(session, post.community) ||
    isAuthor(session, post.author_id)

  if (post.is_hidden && !showHidden) {
    return NextResponse.json(
      { error: "هذا المنشور غير متاح" },
      { status: 403 }
    )
  }

  // Increment views (non-author only) — best-effort, errors ignored.
  if (!isAuthor(session, post.author_id)) {
    query(
      `UPDATE forum_posts SET views_count = views_count + 1 WHERE id = $1`,
      [id]
    ).catch(() => undefined)
  }

  const replyWhere = showHidden
    ? "r.post_id = $1"
    : "r.post_id = $1 AND r.is_approved = TRUE"

  const replies = await query(
    `SELECT r.*,
            u.name        AS author_name,
            u.avatar_url  AS author_avatar,
            u.role        AS author_role,
            EXISTS (
              SELECT 1 FROM forum_reply_likes l
              WHERE l.reply_id = r.id AND l.user_id = $2
            ) AS liked_by_me
     FROM forum_replies r
     JOIN users u ON u.id = r.author_id
     WHERE ${replyWhere}
     ORDER BY
       CASE WHEN r.is_best_answer THEN 0 ELSE 1 END,
       r.created_at ASC`,
    [id, session.sub]
  )

  return NextResponse.json({ post, replies })
}

/**
 * PATCH /api/community/forum/[id]
 * Body: { title?, content?, category?, tags? }
 * Only author or moderator can edit; locking content prevents author edits.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const post = await loadPost(id)
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }

  const isMod = canModerate(session, post.community)
  const author = isAuthor(session, post.author_id)
  if (!isMod && !author) {
    return NextResponse.json({ error: "غير مصرح بالتعديل" }, { status: 403 })
  }
  if (!isMod && post.is_locked) {
    return NextResponse.json(
      { error: "المنشور مغلق ولا يمكن تعديله" },
      { status: 403 }
    )
  }

  let body: {
    title?: string
    content?: string
    category?: string
    tags?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (typeof body.title === "string" && body.title.trim()) {
    values.push(body.title.trim())
    updates.push(`title = $${values.length}`)
  }
  if (typeof body.content === "string" && body.content.trim()) {
    values.push(body.content.trim())
    updates.push(`content = $${values.length}`)
  }
  if (typeof body.category === "string" && body.category.trim()) {
    values.push(body.category.trim())
    updates.push(`category = $${values.length}`)
  }
  if (Array.isArray(body.tags)) {
    values.push(
      body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    )
    updates.push(`tags = $${values.length}`)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "لا يوجد ما يتم تحديثه" }, { status: 400 })
  }

  values.push(id)
  const sql = `UPDATE forum_posts SET ${updates.join(", ")}, updated_at = NOW()
               WHERE id = $${values.length} RETURNING *`
  try {
    const rows = await query(sql, values)
    return NextResponse.json({ post: rows[0] })
  } catch (err) {
    console.error("[community/forum PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const post = await loadPost(id)
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }

  if (!canModerate(session, post.community) && !isAuthor(session, post.author_id)) {
    return NextResponse.json({ error: "غير مصرح بالحذف" }, { status: 403 })
  }

  try {
    await query(`DELETE FROM forum_posts WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[community/forum DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
