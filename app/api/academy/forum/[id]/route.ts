import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    // Get post
    const post = await queryOne(
      `SELECT p.*, u.name as author_name, u.avatar_url as author_avatar
       FROM forum_posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [id]
    )

    if (!post) {
      return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
    }

    // Increment views
    await query(`UPDATE forum_posts SET views_count = views_count + 1 WHERE id = $1`, [id])

    // Get replies
    const replies = await query(
      `SELECT r.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
       FROM forum_replies r
       JOIN users u ON u.id = r.author_id
       WHERE r.post_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at ASC`,
      [id]
    )

    return NextResponse.json({ post, replies })
  } catch (error) {
    console.error("Forum Post GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "الرد فارغ" }, { status: 400 })
    }

    // Verify post exists and isn't locked
    const post = await queryOne<{ is_locked: boolean }>(
      `SELECT is_locked FROM forum_posts WHERE id = $1`,
      [postId]
    )

    if (!post) {
      return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
    }

    if (post.is_locked) {
      return NextResponse.json({ error: "لا يمكن الرد على منشور مغلق" }, { status: 403 })
    }

    // Insert reply
    const newReply = await query(
      `INSERT INTO forum_replies (post_id, author_id, content, is_approved)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [postId, session.sub, content.trim()]
    )

    // Update post stats
    await query(
      `UPDATE forum_posts 
       SET replies_count = replies_count + 1, last_reply_at = NOW(), last_reply_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [session.sub, postId]
    )

    // Append author details for the UI
    const finalReply = { ...newReply[0], author_name: session.name, author_role: session.role }

    return NextResponse.json({ reply: finalReply })
  } catch (error) {
    console.error("Forum Reply POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
