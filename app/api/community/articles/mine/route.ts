import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

/**
 * GET /api/community/articles/mine?community=
 * Returns every article authored by the current user in the given community,
 * regardless of status (drafts, pending, published, rejected, archived).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !["academy", "maqraa"].includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!canAccessCommunity(session, community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const articles = await query(
    `SELECT id, title, slug, excerpt, category, status,
            views_count, likes_count, comments_count,
            reading_minutes, rejected_reason,
            published_at, created_at, updated_at
     FROM articles
     WHERE community = $1 AND author_id = $2
     ORDER BY updated_at DESC`,
    [community, session.sub]
  )
  return NextResponse.json({ articles })
}
