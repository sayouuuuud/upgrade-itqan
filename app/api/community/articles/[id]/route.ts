import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canAccessCommunity,
  canPublishArticle,
  isAuthor,
} from "@/lib/community/permissions"
import { estimateReadingMinutes } from "@/lib/community/slug"
import type { Community } from "@/lib/community/types"

interface ArticleRow {
  id: string
  author_id: string
  community: Community
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  category: string
  tags: string[]
  status: string
  views_count: number
  likes_count: number
  comments_count: number
  reading_minutes: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

async function loadArticleByIdOrSlug(idOrSlug: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug)
  return queryOne<
    ArticleRow & {
      author_name: string
      author_avatar: string | null
    }
  >(
    `SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar
     FROM articles a
     JOIN users u ON u.id = a.author_id
     WHERE ${isUuid ? "a.id = $1" : "a.slug = $1"}`,
    [idOrSlug]
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const article = await loadArticleByIdOrSlug(id)
  if (!article) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
  }
  if (!canAccessCommunity(session, article.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const canSeeDraft =
    isAuthor(session, article.author_id) ||
    canPublishArticle(session, article.community)
  if (article.status !== "published" && !canSeeDraft) {
    return NextResponse.json({ error: "المقال غير متاح" }, { status: 403 })
  }

  // Only count view when published & by non-author.
  if (
    article.status === "published" &&
    !isAuthor(session, article.author_id)
  ) {
    query(`UPDATE articles SET views_count = views_count + 1 WHERE id = $1`, [
      article.id,
    ]).catch(() => undefined)
  }

  const likedByMe = await queryOne(
    `SELECT 1 FROM article_likes WHERE article_id = $1 AND user_id = $2`,
    [article.id, session.sub]
  )

  return NextResponse.json({ article: { ...article, liked_by_me: !!likedByMe } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const article = await loadArticleByIdOrSlug(id)
  if (!article) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
  }

  const author = isAuthor(session, article.author_id)
  const isPublisher = canPublishArticle(session, article.community)
  if (!author && !isPublisher) {
    return NextResponse.json({ error: "غير مصرح بالتعديل" }, { status: 403 })
  }

  // Authors can only edit while draft or rejected. Publishers can always edit.
  if (
    author &&
    !isPublisher &&
    !["draft", "rejected"].includes(article.status)
  ) {
    return NextResponse.json(
      { error: "لا يمكن تعديل المقال بعد إرساله للمراجعة" },
      { status: 403 }
    )
  }

  let body: {
    title?: string
    content?: string
    excerpt?: string
    category?: string
    tags?: string[]
    cover_image_url?: string | null
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
    values.push(estimateReadingMinutes(body.content))
    updates.push(`reading_minutes = $${values.length}`)
  }
  if (typeof body.excerpt === "string") {
    values.push(body.excerpt.trim() || null)
    updates.push(`excerpt = $${values.length}`)
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
  if (body.cover_image_url !== undefined) {
    values.push(body.cover_image_url?.trim() || null)
    updates.push(`cover_image_url = $${values.length}`)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "لا يوجد ما يتم تحديثه" }, { status: 400 })
  }

  // If the author edits a previously rejected article, send it back to draft.
  if (author && article.status === "rejected") {
    updates.push(`status = 'draft'`)
    updates.push(`rejected_reason = NULL`)
  }

  values.push(article.id)
  const sql = `UPDATE articles SET ${updates.join(", ")}, updated_at = NOW()
               WHERE id = $${values.length} RETURNING *`
  try {
    const rows = await query(sql, values)
    return NextResponse.json({ article: rows[0] })
  } catch (err) {
    console.error("[community/articles PATCH]", err)
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
  const article = await loadArticleByIdOrSlug(id)
  if (!article) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
  }
  if (
    !isAuthor(session, article.author_id) &&
    !canPublishArticle(session, article.community)
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  try {
    await query(`DELETE FROM articles WHERE id = $1`, [article.id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[community/articles DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
