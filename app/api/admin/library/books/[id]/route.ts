import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { deleteFromStorage } from "@/lib/storage"

const ADMIN_ROLES: ("admin" | "academy_admin")[] = ["admin", "academy_admin"]

const ALLOWED_FIELDS = [
  "title",
  "author",
  "description",
  "cover_image_url",
  "cover_image_key",
  "pages_count",
  "publish_date",
  "category",
  "is_published",
  "display_order",
] as const

type AllowedField = (typeof ALLOWED_FIELDS)[number]

// GET /api/admin/library/books/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  try {
    const book = await queryOne(
      `SELECT * FROM books WHERE id = $1`,
      [id]
    )
    if (!book) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const files = await query(
      `SELECT id, language, language_label, pdf_url, pdf_key, file_size_bytes, created_at
       FROM book_files WHERE book_id = $1
       ORDER BY
         CASE WHEN language = 'ar' THEN 0 ELSE 1 END,
         created_at ASC`,
      [id]
    )
    return NextResponse.json({ book, files })
  } catch (error) {
    console.error("[admin/library] get error:", error)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

// PATCH /api/admin/library/books/[id]
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
    const setFragments: string[] = []
    const args: any[] = []

    for (const field of ALLOWED_FIELDS) {
      if (field in (body as Record<string, unknown>)) {
        const raw = (body as Record<AllowedField, unknown>)[field]
        let value: unknown = raw
        if (field === "pages_count" || field === "display_order") {
          const n = Number(raw)
          value = Number.isFinite(n) ? n : null
        } else if (field === "is_published") {
          value = Boolean(raw)
        } else if (typeof raw === "string") {
          value = raw.trim() || null
        }
        args.push(value)
        setFragments.push(`${field} = $${args.length}`)
      }
    }

    if (!setFragments.length) {
      return NextResponse.json({ error: "لا يوجد ما يتم تحديثه" }, { status: 400 })
    }

    args.push(id)
    await query(
      `UPDATE books SET ${setFragments.join(", ")}, updated_at = NOW()
       WHERE id = $${args.length}`,
      args
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/library] update error:", error)
    return NextResponse.json({ error: "حدث خطأ في التحديث" }, { status: 500 })
  }
}

// DELETE /api/admin/library/books/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  try {
    const fileKeys = await query<{ key: string | null }>(
      `SELECT pdf_key AS key FROM book_files WHERE book_id = $1 AND pdf_key IS NOT NULL`,
      [id]
    )
    const cover = await queryOne<{ key: string | null }>(
      `SELECT cover_image_key AS key FROM books WHERE id = $1`,
      [id]
    )

    await query(`DELETE FROM books WHERE id = $1`, [id])

    // Best-effort storage cleanup (don't fail the request if these error)
    for (const row of fileKeys) {
      if (row.key) await deleteFromStorage(row.key).catch(() => null)
    }
    if (cover?.key) await deleteFromStorage(cover.key).catch(() => null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/library] delete error:", error)
    return NextResponse.json({ error: "حدث خطأ في الحذف" }, { status: 500 })
  }
}
