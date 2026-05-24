import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import {
  canAccessCommunity,
  isCommunityAdmin,
} from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

const VALID_COMMUNITIES: Community[] = ["academy", "maqraa"]

/**
 * GET /api/community/admin/rules?community=academy|maqraa
 *
 * Returns the rule list for a community. Read access for anyone who can
 * access the community (so the public sidebar can render them).
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
    const rules = await query(
      `SELECT * FROM community_rules
       WHERE community = $1
       ORDER BY position ASC, created_at ASC`,
      [community]
    )
    return NextResponse.json({ rules })
  } catch (err) {
    console.error("[community/admin/rules GET]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * POST /api/community/admin/rules
 * Body: { community, title, body?, position? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  let body: {
    community?: Community
    title?: string
    body?: string | null
    position?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }
  const community = body.community
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!isCommunityAdmin(session, community)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 })
  }
  const title = body.title?.trim()
  if (!title) {
    return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })
  }
  if (title.length > 160) {
    return NextResponse.json({ error: "العنوان طويل جدًا" }, { status: 400 })
  }
  const position = Number.isFinite(body.position) ? Number(body.position) : 0

  try {
    const rows = await query(
      `INSERT INTO community_rules (community, position, title, body, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [community, position, title, body.body || null, session.sub]
    )
    return NextResponse.json({ rule: rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[community/admin/rules POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
