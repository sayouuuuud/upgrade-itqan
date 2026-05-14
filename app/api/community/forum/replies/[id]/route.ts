import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canModerate, isAuthor } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

async function loadReplyWithCommunity(replyId: string) {
  return queryOne<{
    id: string
    author_id: string
    post_id: string
    community: Community
    is_locked: boolean
  }>(
    `SELECT r.id, r.author_id, r.post_id,
            p.community, p.is_locked
     FROM forum_replies r
     JOIN forum_posts   p ON p.id = r.post_id
     WHERE r.id = $1`,
    [replyId]
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const reply = await loadReplyWithCommunity(id)
  if (!reply) {
    return NextResponse.json({ error: "الرد غير موجود" }, { status: 404 })
  }

  const isMod = canModerate(session, reply.community)
  const author = isAuthor(session, reply.author_id)
  if (!isMod && !author) {
    return NextResponse.json({ error: "غير مصرح بالتعديل" }, { status: 403 })
  }
  if (!isMod && reply.is_locked) {
    return NextResponse.json(
      { error: "الموضوع مغلق ولا يمكن تعديل الرد" },
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
    const rows = await query(
      `UPDATE forum_replies SET content = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [content, id]
    )
    return NextResponse.json({ reply: rows[0] })
  } catch (err) {
    console.error("[forum reply PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const reply = await loadReplyWithCommunity(id)
  if (!reply) {
    return NextResponse.json({ error: "الرد غير موجود" }, { status: 404 })
  }
  if (!canModerate(session, reply.community) && !isAuthor(session, reply.author_id)) {
    return NextResponse.json({ error: "غير مصرح بالحذف" }, { status: 403 })
  }
  try {
    await query(`DELETE FROM forum_replies WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[forum reply DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
