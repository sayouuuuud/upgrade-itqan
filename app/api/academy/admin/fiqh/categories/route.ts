import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const ADMIN_ROLES = ['admin', 'academy_admin']

/**
 * GET /api/academy/admin/fiqh/categories
 * Admin-facing categories list, includes inactive ones so the admin
 * can re-enable them. Augments the public categories endpoint.
 */
export async function GET() {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const categories = await query<{
    id: string
    slug: string
    name_ar: string
    name_en: string | null
    description: string | null
    sort_order: number
    is_active: boolean
    open_count: number
    published_count: number
  }>(
    `SELECT c.id, c.slug, c.name_ar, c.name_en, c.description,
            c.sort_order, c.is_active,
            COALESCE((
              SELECT COUNT(*)::int FROM fiqh_questions q
                WHERE q.category_id = c.id
                  AND q.status IN ('pending','assigned','in_progress','awaiting_consent')
            ), 0) AS open_count,
            COALESCE((
              SELECT COUNT(*)::int FROM fiqh_questions q
                WHERE q.category_id = c.id AND q.is_published = TRUE
            ), 0) AS published_count
       FROM fiqh_categories c
       ORDER BY c.sort_order ASC, c.name_ar ASC`
  )
  return NextResponse.json({ categories })
}

/**
 * POST /api/academy/admin/fiqh/categories
 * Create a new fiqh category.
 *
 * Body: { slug: string, name_ar: string, name_en?: string, description?: string,
 *         sort_order?: number, is_active?: boolean }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const slugRaw = typeof body?.slug === 'string' ? body.slug.trim() : ''
  const nameAr = typeof body?.name_ar === 'string' ? body.name_ar.trim() : ''
  if (!slugRaw || !nameAr) {
    return NextResponse.json(
      { error: 'الـ slug والاسم العربي مطلوبان' },
      { status: 400 }
    )
  }

  // Normalize slug: lowercase, replace spaces with hyphens, keep ASCII/digits
  const slug = slugRaw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
  if (!slug) {
    return NextResponse.json({ error: 'slug غير صالح' }, { status: 400 })
  }

  const exists = await queryOne<{ id: string }>(
    `SELECT id FROM fiqh_categories WHERE slug = $1`,
    [slug]
  )
  if (exists) {
    return NextResponse.json({ error: 'هذا الـ slug مستخدم بالفعل' }, { status: 409 })
  }

  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO fiqh_categories
       (slug, name_ar, name_en, description, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE))
     RETURNING id`,
    [
      slug,
      nameAr,
      typeof body?.name_en === 'string' ? body.name_en.trim() || null : null,
      typeof body?.description === 'string' ? body.description.trim() || null : null,
      Number.isFinite(body?.sort_order) ? Number(body.sort_order) : 100,
      typeof body?.is_active === 'boolean' ? body.is_active : null,
    ]
  )

  return NextResponse.json({ id: inserted?.id, slug })
}
