import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/library/books?search=&category=&language=
// Public to any authenticated user; only returns published books.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()
    const category = (searchParams.get("category") || "").trim()
    const language = (searchParams.get("language") || "").trim()

    const conditions: string[] = ["b.is_published = TRUE"]
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(b.title ILIKE $${params.length} OR b.author ILIKE $${params.length})`)
    }
    if (category) {
      params.push(category)
      conditions.push(`b.category = $${params.length}`)
    }
    if (language) {
      params.push(language)
      conditions.push(
        `EXISTS (SELECT 1 FROM book_files bf2 WHERE bf2.book_id = b.id AND bf2.language = $${params.length})`
      )
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const books = await query<{
      id: string
      title: string
      author: string | null
      description: string | null
      cover_image_url: string | null
      pages_count: number | null
      publish_date: string | null
      category: string | null
      languages: { language: string; language_label: string | null }[]
      created_at: string
    }>(
      `
      SELECT
        b.id, b.title, b.author, b.description, b.cover_image_url,
        b.pages_count, b.publish_date, b.category, b.created_at,
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
    console.error("[library] list error:", error)
    return NextResponse.json({ error: "حدث خطأ في جلب الكتب" }, { status: 500 })
  }
}
