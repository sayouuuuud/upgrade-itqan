import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { canAccessCommunity } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

const VALID_COMMUNITIES: Community[] = ["academy", "maqraa"]

/**
 * GET /api/community/stats?community=academy|maqraa
 *
 * Lightweight stats used by the forum's right rail:
 *  - total posts / replies / members participating
 *  - top contributors (by total posts + replies in the community)
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!canAccessCommunity(session, community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const [totals, members, topUsers, categories] = await Promise.all([
      query<{ posts: string; replies: string }>(
        `SELECT
           (SELECT COUNT(*) FROM forum_posts WHERE community = $1 AND is_hidden = FALSE) AS posts,
           (SELECT COUNT(*) FROM forum_replies r
              JOIN forum_posts p ON p.id = r.post_id
              WHERE p.community = $1 AND r.is_approved = TRUE) AS replies`,
        [community]
      ),
      query<{ members: string }>(
        `SELECT COUNT(DISTINCT author_id)::text AS members
         FROM (
           SELECT author_id FROM forum_posts WHERE community = $1
           UNION ALL
           SELECT r.author_id FROM forum_replies r
             JOIN forum_posts p ON p.id = r.post_id
             WHERE p.community = $1
         ) x`,
        [community]
      ),
      query<{
        id: string
        name: string
        avatar_url: string | null
        role: string
        score: string
      }>(
        `SELECT u.id, u.name, u.avatar_url, u.role,
                (COALESCE(p.posts_count, 0) + COALESCE(r.replies_count, 0))::text AS score
         FROM users u
         LEFT JOIN (
           SELECT author_id, COUNT(*) AS posts_count
           FROM forum_posts WHERE community = $1
           GROUP BY author_id
         ) p ON p.author_id = u.id
         LEFT JOIN (
           SELECT fr.author_id, COUNT(*) AS replies_count
           FROM forum_replies fr
           JOIN forum_posts fp ON fp.id = fr.post_id
           WHERE fp.community = $1
           GROUP BY fr.author_id
         ) r ON r.author_id = u.id
         WHERE COALESCE(p.posts_count, 0) + COALESCE(r.replies_count, 0) > 0
         ORDER BY score DESC NULLS LAST
         LIMIT 5`,
        [community]
      ),
      query<{ category: string; count: string }>(
        `SELECT category, COUNT(*)::text AS count
         FROM forum_posts
         WHERE community = $1 AND is_hidden = FALSE
         GROUP BY category
         ORDER BY COUNT(*) DESC`,
        [community]
      ),
    ])

    return NextResponse.json({
      totals: totals[0] || { posts: "0", replies: "0" },
      members_count: Number(members[0]?.members || 0),
      top_contributors: topUsers,
      categories,
    })
  } catch (err) {
    console.error("[community/stats GET]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
