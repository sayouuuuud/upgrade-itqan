import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole, type AllRoles } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

const ADMIN_ROLES: AllRoles[] = ["admin", "academy_admin"]

async function getBookRoot(): Promise<string | null> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM categories WHERE slug = 'book' LIMIT 1`
  )
  return row?.id ?? null
}

/**
 * GET /api/admin/library/categories
 * Lists all book sub-categories (children of the "book" root) with usage counts.
 */
export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const rootId = await getBookRoot()
  if (!rootId) return NextResponse.json({ categories: [] })

  const rows = await query<{
    id: string
    name: string
    slug: string
    color: string | null
    icon: string | null
    display_order: number
    is_active: boolean
    books_count: number
  }>(
    `SELECT c.id, c.name, c.slug, c.color, c.icon, c.display_order, c.is_active,
            (SELECT COUNT(*)::int FROM books b WHERE b.category_id = c.id AND b.library_domain = 'academy') AS books_count
       FROM categories c
      WHERE c.parent_id = $1 AND c.library_domain = 'academy'
      ORDER BY c.display_order ASC, c.name ASC`,
    [rootId]
  )
  return NextResponse.json({ categories: rows })
}

/**
 * POST /api/admin/library/categories
 * Creates a new book sub-category under the "book" root.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const rootId = await getBookRoot()
  if (!rootId) {
    return NextResponse.json({ error: "لم يتم العثور على التصنيف الرئيسي" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const name = (body?.name || "").toString().trim()
    if (!name) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
    }

    const rawSlug = (body?.slug || name).toString().trim().toLowerCase()
    const slug = rawSlug
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 255)

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
      [slug]
    )
    if (existing) {
      return NextResponse.json({ error: "يوجد تصنيف بنفس الاسم/الرابط" }, { status: 409 })
    }

    const color = body?.color ? String(body.color).slice(0, 16) : null
    const icon = body?.icon ? String(body.icon).slice(0, 64) : null
    const display_order = Number.isFinite(Number(body?.display_order))
      ? Number(body?.display_order)
      : 0

    const row = await queryOne<{ id: string; name: string; slug: string }>(
      `INSERT INTO categories
         (name, slug, parent_id, color, icon, display_order, is_active, library_domain, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'academy', NOW(), NOW(), $7)
       RETURNING id, name, slug`,
      [name.slice(0, 255), slug, rootId, color, icon, display_order, session!.sub]
    )

    return NextResponse.json({ category: row }, { status: 201 })
  } catch (error) {
    console.error("[academy/admin/library/categories POST]", error)
    return NextResponse.json({ error: "حدث خطأ في إنشاء التصنيف" }, { status: 500 })
  }
}
