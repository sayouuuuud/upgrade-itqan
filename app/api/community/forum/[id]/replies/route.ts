import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import { createNotification } from "@/lib/notifications"
import type { Community } from "@/lib/community/types"

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
    is_locked: boolean
    title: string
  }>(
    `SELECT id, community, author_id, is_locked, title FROM forum_posts WHERE id = $1`,
    [id]
  )
  if (!post) {
    return NextResponse.json({ error: "المنشور غير موجود" }, { status: 404 })
  }
  if (!canAccessCommunity(session, post.community)) {
    return NextResponse.json(
      { error: "لا تملك صلاحية الوصول لهذا المجتمع" },
      { status: 403 }
    )
  }
  if (post.is_locked) {
    return NextResponse.json(
      { error: "لا يمكن الرد على منشور مغلق" },
      { status: 403 }
    )
  }

  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }
  const content = body.content?.trim()
  if (!content) {
    return NextResponse.json({ error: "الرد فارغ" }, { status: 400 })
  }

  try {
    const rows = await query<{ id: string; created_at: string }>(
      `INSERT INTO forum_replies (post_id, author_id, content, is_approved)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [id, session.sub, content]
    )

    // Notify post owner (unless they're the one replying)
    if (post.author_id !== session.sub) {
      createNotification({
        userId: post.author_id,
        type: "general",
        title: "رد جديد على منشورك",
        message: `${session.name} رد على: ${post.title}`,
        category: "general",
        link: `/academy/student/forum?post=${id}`,
      })
    }

    const reply = {
      ...rows[0],
      author_name: session.name,
      author_role: session.role,
      liked_by_me: false,
    }
    return NextResponse.json({ reply }, { status: 201 })
  } catch (err) {
    console.error("[community/forum reply POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
