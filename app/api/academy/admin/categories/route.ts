import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/categories
 * Returns every category enriched with the parent's name (when set) and
 * usage counts (courses / lessons / public_lessons) so the admin
 * "Categories" page can render a hierarchy with live stats.
 *
 * Authenticated users (e.g. teachers filling course forms) can still read
 * the basic list — the heavier counts are only added for admins.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = ['admin', 'academy_admin'].includes(session.role)

  try {
    const rows = await query<{
      id: string
      name: string
      slug: string | null
      description: string | null
      short_description: string | null
      color: string | null
      icon: string | null
      icon_url: string | null
      parent_id: string | null
      parent_name: string | null
      display_order: number
      is_active: boolean
      courses_count: number
      lessons_count: number
      public_lessons_count: number
      created_at: string
    }>(
      `SELECT c.id, c.name, c.slug, c.description, c.short_description,
              c.color, c.icon, c.icon_url, c.parent_id, p.name AS parent_name,
              c.display_order, c.is_active, c.created_at,
              COALESCE(usage.courses_count,        0) AS courses_count,
              COALESCE(usage.lessons_count,        0) AS lessons_count,
              COALESCE(usage.public_lessons_count, 0) AS public_lessons_count
         FROM categories c
         LEFT JOIN categories p     ON p.id = c.parent_id
         LEFT JOIN category_usage_v usage ON usage.id = c.id
         ORDER BY COALESCE(c.display_order, 0) ASC, c.name ASC`
    )
    return NextResponse.json({ data: rows, isAdmin })
  } catch (error) {
    // category_usage_v may not exist yet (migration not applied). Fall back to
    // a categories-only query so the page still works.
    try {
      const rows = await query(
        `SELECT c.id, c.name, c.slug, c.description, c.short_description,
                c.color, c.icon, c.icon_url, c.parent_id, p.name AS parent_name,
                c.display_order, c.is_active, c.created_at,
                0 AS courses_count, 0 AS lessons_count, 0 AS public_lessons_count
           FROM categories c
           LEFT JOIN categories p ON p.id = c.parent_id
           ORDER BY COALESCE(c.display_order, 0) ASC, c.name ASC`
      )
      return NextResponse.json({ data: rows, isAdmin, warning: 'migration_pending' })
    } catch {
      return NextResponse.json({ error: 'error' }, { status: 500 })
    }
  }
}

/**
 * POST /api/academy/admin/categories
 * Creates a new category. Admin-only. Accepts the full editorial payload
 * (name, slug, description, short_description, parent_id, color, icon,
 * display_order, is_active).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      name,
      slug = null,
      description = null,
      short_description = null,
      parent_id = null,
      color = null,
      icon = null,
      icon_url = null,
      display_order = 0,
      is_active = true,
    } = body as Record<string, any>

    if (!name?.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    }

    const normalizedSlug = (slug || name)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 255)

    const existing = await query<{ id: string }>(
      `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
      [normalizedSlug]
    )
    if (existing.length > 0) {
      return NextResponse.json({ error: 'يوجد تصنيف آخر بنفس الاسم/الرابط' }, { status: 409 })
    }

    const res = await query(
      `INSERT INTO categories
         (name, slug, description, short_description, parent_id,
          color, icon, icon_url, display_order, is_active,
          created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
       RETURNING *`,
      [
        name.trim().slice(0, 255),
        normalizedSlug,
        description,
        short_description,
        parent_id || null,
        color,
        icon,
        icon_url,
        display_order,
        is_active,
        session.sub,
      ]
    )

    return NextResponse.json({ data: res[0] })
  } catch (error) {
    console.error('[admin/categories POST]', error)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
