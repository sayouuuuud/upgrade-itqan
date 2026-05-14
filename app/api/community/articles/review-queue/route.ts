import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { canPublishArticle } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

/**
 * GET /api/community/articles/review-queue?community=
 * Lists everything in `pending_review` for a publisher to action.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !["academy", "maqraa"].includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!canPublishArticle(session, community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const articles = await query(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.category, a.tags,
            a.reading_minutes, a.status, a.created_at, a.updated_at,
            u.name AS author_name, u.avatar_url AS author_avatar
     FROM articles a
     JOIN users u ON u.id = a.author_id
     WHERE a.community = $1 AND a.status = 'pending_review'
     ORDER BY a.updated_at ASC`,
    [community]
  )
  return NextResponse.json({ articles })
}
