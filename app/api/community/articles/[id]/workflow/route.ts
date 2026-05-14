import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canPublishArticle,
  isAuthor,
} from "@/lib/community/permissions"
import { createNotification } from "@/lib/notifications"
import type { Community } from "@/lib/community/types"

/**
 * POST /api/community/articles/[id]/workflow
 * Body: { action: 'submit'|'publish'|'reject'|'archive', reason? }
 *
 * - submit:  author -> pending_review     (author only)
 * - publish: pending_review -> published  (publisher only)
 * - reject:  pending_review -> rejected   (publisher only) + reason
 * - archive: published -> archived        (author or publisher)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const article = await queryOne<{
    id: string
    author_id: string
    community: Community
    status: string
    title: string
  }>(
    `SELECT id, author_id, community, status, title FROM articles WHERE id = $1`,
    [id]
  )
  if (!article) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
  }

  let body: { action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const author = isAuthor(session, article.author_id)
  const isPublisher = canPublishArticle(session, article.community)

  switch (body.action) {
    case "submit": {
      if (!author) {
        return NextResponse.json(
          { error: "فقط المؤلف يمكنه إرسال المقال للمراجعة" },
          { status: 403 }
        )
      }
      if (!["draft", "rejected"].includes(article.status)) {
        return NextResponse.json(
          { error: "لا يمكن إرسال المقال في حالته الحالية" },
          { status: 400 }
        )
      }
      await query(
        `UPDATE articles SET status = 'pending_review', updated_at = NOW(), rejected_reason = NULL
         WHERE id = $1`,
        [id]
      )
      return NextResponse.json({ ok: true, status: "pending_review" })
    }

    case "publish": {
      if (!isPublisher) {
        return NextResponse.json({ error: "غير مصرح بالنشر" }, { status: 403 })
      }
      if (article.status !== "pending_review") {
        return NextResponse.json(
          { error: "المقال ليس في حالة مراجعة" },
          { status: 400 }
        )
      }
      await query(
        `UPDATE articles
            SET status = 'published',
                published_at = COALESCE(published_at, NOW()),
                reviewed_by = $1,
                reviewed_at = NOW(),
                updated_at = NOW()
          WHERE id = $2`,
        [session.sub, id]
      )
      if (article.author_id !== session.sub) {
        createNotification({
          userId: article.author_id,
          type: "general",
          title: "تم نشر مقالك",
          message: `تم اعتماد ونشر مقالك: ${article.title}`,
          category: "general",
          link: `/articles`,
        })
      }
      return NextResponse.json({ ok: true, status: "published" })
    }

    case "reject": {
      if (!isPublisher) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
      }
      if (article.status !== "pending_review") {
        return NextResponse.json(
          { error: "المقال ليس في حالة مراجعة" },
          { status: 400 }
        )
      }
      const reason = body.reason?.trim() || null
      await query(
        `UPDATE articles
            SET status = 'rejected',
                rejected_reason = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                updated_at = NOW()
          WHERE id = $3`,
        [reason, session.sub, id]
      )
      if (article.author_id !== session.sub) {
        createNotification({
          userId: article.author_id,
          type: "general",
          title: "تم رفض المقال",
          message: `تم رفض مقالك (${article.title})${reason ? ` للسبب: ${reason}` : ""}`,
          category: "general",
        })
      }
      return NextResponse.json({ ok: true, status: "rejected" })
    }

    case "archive": {
      if (!author && !isPublisher) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
      }
      await query(
        `UPDATE articles SET status = 'archived', updated_at = NOW() WHERE id = $1`,
        [id]
      )
      return NextResponse.json({ ok: true, status: "archived" })
    }

    default:
      return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 })
  }
}
