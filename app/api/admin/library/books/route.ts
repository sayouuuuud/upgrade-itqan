import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ADMIN_ROLES: ("admin" | "academy_admin")[] = ["admin", "academy_admin"]

// GET /api/admin/library/books
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()

    const conditions: string[] = []
    const params: any[] = []
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(b.title ILIKE $${params.length} OR b.author ILIKE $${params.length})`)
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const books = await query(
      `
      SELECT
        b.*,
        COALESCE(
          (SELECT COUNT(*) FROM book_files bf WHERE bf.book_id = b.id),
          0
        )::int AS languages_count,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'language', bf.language,
              'language_label', bf.language_label
            ) ORDER BY bf.created_at)
            FROM book_files bf WHERE bf.book_id = b.id
          ),
          '[]'::json
        ) AS languages
      FROM books b
      ${whereClause}
      ORDER BY b.display_order ASC, b.created_at DESC
      `,
      params
    )

    return NextResponse.json({ books })
  } catch (error) {
    console.error("[admin/library] list error:", error)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

// POST /api/admin/library/books
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      title,
      author,
      description,
      cover_image_url,
      cover_image_key,
      pages_count,
      publish_date,
      category,
      is_published,
      display_order,
    } = body || {}

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })
    }

    const rows = await query<{ id: string }>(
      `INSERT INTO books
        (title, author, description, cover_image_url, cover_image_key,
         pages_count, publish_date, category, is_published, display_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9, TRUE),COALESCE($10, 0),$11)
       RETURNING id`,
      [
        title.trim(),
        author?.toString().trim() || null,
        description?.toString().trim() || null,
        cover_image_url || null,
        cover_image_key || null,
        Number.isFinite(Number(pages_count)) ? Number(pages_count) : null,
        publish_date || null,
        category || null,
        typeof is_published === "boolean" ? is_published : true,
        Number.isFinite(Number(display_order)) ? Number(display_order) : 0,
        session!.sub,
      ]
    )

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (error) {
    console.error("[admin/library] create error:", error)
    return NextResponse.json({ error: "حدث خطأ في إنشاء الكتاب" }, { status: 500 })
  }
}
