import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const ADMIN_ROLES = ['admin', 'academy_admin']

/**
 * PATCH /api/academy/admin/fiqh/categories/:id
 * Update a fiqh category. Any field may be omitted.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const sets: string[] = []
  const values: unknown[] = []
  let i = 1

  if (typeof body?.name_ar === 'string' && body.name_ar.trim()) {
    sets.push(`name_ar = $${i++}`)
    values.push(body.name_ar.trim())
  }
  if (typeof body?.name_en === 'string') {
    sets.push(`name_en = $${i++}`)
    values.push(body.name_en.trim() || null)
  }
  if (typeof body?.description === 'string') {
    sets.push(`description = $${i++}`)
    values.push(body.description.trim() || null)
  }
  if (Number.isFinite(body?.sort_order)) {
    sets.push(`sort_order = $${i++}`)
    values.push(Number(body.sort_order))
  }
  if (typeof body?.is_active === 'boolean') {
    sets.push(`is_active = $${i++}`)
    values.push(body.is_active)
  }
  if (typeof body?.slug === 'string' && body.slug.trim()) {
    const slug = body.slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
    if (slug) {
      sets.push(`slug = $${i++}`)
      values.push(slug)
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'لا يوجد تغييرات' }, { status: 400 })
  }

  values.push(id)
  const r = await query(
    `UPDATE fiqh_categories SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`,
    values
  )
  if (!r.length) {
    return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/academy/admin/fiqh/categories/:id
 * Soft-delete by setting is_active = FALSE if any question references the
 * category, otherwise hard delete. This avoids breaking historical Q&A.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const { id } = await params
  const inUse = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM fiqh_questions WHERE category_id = $1`,
    [id]
  )
  if (inUse && Number(inUse.c) > 0) {
    await query(
      `UPDATE fiqh_categories SET is_active = FALSE WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ ok: true, mode: 'soft-deleted' })
  }
  const r = await query(`DELETE FROM fiqh_categories WHERE id = $1 RETURNING id`, [id])
  if (!r.length) {
    return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, mode: 'deleted' })
}
