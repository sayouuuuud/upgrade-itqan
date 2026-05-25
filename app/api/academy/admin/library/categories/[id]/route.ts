import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole, type AllRoles } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

const ADMIN_ROLES: AllRoles[] = ["admin", "academy_admin"]

/**
 * PATCH /api/admin/library/categories/[id]
 * Updates a book sub-category. Will not touch parent_id; categories must stay
 * under the "book" root.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const updates: string[] = []
    const values: unknown[] = []

    if (typeof body?.name === "string") {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
      }
      values.push(name.slice(0, 255))
      updates.push(`name = $${values.length}`)
    }

    if (typeof body?.slug === "string" && body.slug.trim()) {
      const slug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 255)
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM categories WHERE slug = $1 AND id <> $2 AND library_domain = 'academy' LIMIT 1`,
        [slug, id]
      )
      if (existing) {
        return NextResponse.json({ error: "يوجد تصنيف بنفس الرابط" }, { status: 409 })
      }
      values.push(slug)
      updates.push(`slug = $${values.length}`)
    }

    if ("color" in body) {
      values.push(body.color ? String(body.color).slice(0, 16) : null)
      updates.push(`color = $${values.length}`)
    }

    if ("icon" in body) {
      values.push(body.icon ? String(body.icon).slice(0, 64) : null)
      updates.push(`icon = $${values.length}`)
    }

    if ("display_order" in body) {
      values.push(Number.isFinite(Number(body.display_order)) ? Number(body.display_order) : 0)
      updates.push(`display_order = $${values.length}`)
    }

    if ("is_active" in body) {
      values.push(!!body.is_active)
      updates.push(`is_active = $${values.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true })
    }

    values.push(id)
    await query(
      `UPDATE categories SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${values.length} AND library_domain = 'academy'`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[academy/admin/library/categories PATCH]", error)
    return NextResponse.json({ error: "حدث خطأ في تحديث التصنيف" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/library/categories/[id]
 * Deletes a book sub-category. Books that point to it will have their
 * category_id set to NULL via the FK constraint.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id } = await params

  // Ensure we only allow deleting children of the book root.
  const cat = await queryOne<{ parent_id: string | null }>(
    `SELECT c.parent_id
       FROM categories c
       JOIN categories root ON root.id = c.parent_id AND root.slug = 'book'
      WHERE c.id = $1 AND c.library_domain = 'academy'`,
    [id]
  )
  if (!cat) {
    return NextResponse.json({ error: "التصنيف غير موجود أو ليس تصنيف كتاب" }, { status: 404 })
  }

  await query(`DELETE FROM categories WHERE id = $1 AND library_domain = 'academy'`, [id])
  return NextResponse.json({ success: true })
}
