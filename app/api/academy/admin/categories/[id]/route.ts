import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * PATCH /api/academy/admin/categories/[id]
 * Updates an existing category. Accepts any subset of:
 *   name, slug, description, short_description, parent_id, color, icon,
 *   icon_url, display_order, is_active.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()

    // Guard against cycles: setting parent_id to self or a descendant.
    if (body.parent_id) {
      if (body.parent_id === id) {
        return NextResponse.json({ error: 'لا يمكن أن يكون التصنيف أبًا لنفسه' }, { status: 400 })
      }
      const descendants = await query<{ id: string }>(
        `WITH RECURSIVE descendants AS (
           SELECT id, parent_id FROM categories WHERE parent_id = $1
           UNION
           SELECT c.id, c.parent_id FROM categories c
             JOIN descendants d ON d.id = c.parent_id
         )
         SELECT id FROM descendants`,
        [id]
      )
      if (descendants.some(d => d.id === body.parent_id)) {
        return NextResponse.json({ error: 'لا يمكن جعل تصنيف فرعي أبًا للتصنيف الحالي' }, { status: 400 })
      }
    }

    const sets: string[] = []
    const values: unknown[] = []
    const push = (col: string, v: unknown) => { sets.push(`${col} = $${values.length + 1}`); values.push(v) }

    if (body.name !== undefined) push('name', String(body.name).slice(0, 255))
    if (body.slug !== undefined) {
      const normalized = String(body.slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 255) || null
      push('slug', normalized)
    }
    if (body.description !== undefined) push('description', body.description)
    if (body.short_description !== undefined) push('short_description', body.short_description)
    if (body.parent_id !== undefined) push('parent_id', body.parent_id || null)
    if (body.color !== undefined) push('color', body.color)
    if (body.icon !== undefined) push('icon', body.icon)
    if (body.icon_url !== undefined) push('icon_url', body.icon_url)
    if (body.display_order !== undefined) push('display_order', Number(body.display_order) || 0)
    if (body.is_active !== undefined) push('is_active', !!body.is_active)
    sets.push('updated_at = NOW()')

    if (sets.length === 1) {
      return NextResponse.json({ error: 'لا توجد حقول للتحديث' }, { status: 400 })
    }

    values.push(id)
    const res = await query(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )
    if (res.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({ data: res[0] })
  } catch (error) {
    console.error('[admin/categories PATCH]', error)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}

/**
 * DELETE /api/academy/admin/categories/[id]
 * Refuses to delete a category that still references any content (courses,
 * lessons via course, public_lessons) unless ?force=1 is passed, in which
 * case the relationship is detached (set NULL) and the row removed.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1'

    const usage = await query<{ courses: number; lessons: number; public_lessons: number; children: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM courses WHERE category_id = $1)            AS courses,
         (SELECT COUNT(*)::int FROM lessons l JOIN courses c ON c.id = l.course_id WHERE c.category_id = $1) AS lessons,
         (SELECT COUNT(*)::int FROM public_lessons WHERE category_id = $1)     AS public_lessons,
         (SELECT COUNT(*)::int FROM categories WHERE parent_id = $1)           AS children`,
      [id]
    )
    const u = usage[0] || { courses: 0, lessons: 0, public_lessons: 0, children: 0 }
    const totalUsage = Number(u.courses) + Number(u.public_lessons)

    if (totalUsage > 0 && !force) {
      return NextResponse.json(
        {
          error: 'category_in_use',
          message: `هذا التصنيف مستخدم في ${u.courses} دورة و ${u.public_lessons} حلقة. أكّد الحذف لإزالته وفك ارتباط المحتوى.`,
          usage: u,
        },
        { status: 409 }
      )
    }

    // Detach descendants and content before deleting (FK is ON DELETE SET NULL
    // for course/public_lesson, but we tighten the guarantee explicitly here).
    await query(`UPDATE courses        SET category_id = NULL WHERE category_id = $1`, [id])
    await query(`UPDATE public_lessons SET category_id = NULL WHERE category_id = $1`, [id])
    await query(`UPDATE categories     SET parent_id   = NULL WHERE parent_id  = $1`, [id])

    const res = await query(`DELETE FROM categories WHERE id = $1 RETURNING *`, [id])
    if (res.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, usage: u })
  } catch (error) {
    console.error('[admin/categories DELETE]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
