import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

// GET /api/library/books/[id]
// Returns the book, its language files, and related books
// (same category OR same author).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params

  try {
    const book = await queryOne<{
      id: string
      title: string
      author: string | null
      description: string | null
      cover_image_url: string | null
      pages_count: number | null
      publish_date: string | null
      category: string | null
      is_published: boolean
      created_at: string
    }>(
      `SELECT id, title, author, description, cover_image_url,
              pages_count, publish_date, category, is_published, created_at
       FROM books WHERE id = $1 AND is_published = TRUE`,
      [id]
    )

    if (!book) {
      return NextResponse.json({ error: "الكتاب غير موجود" }, { status: 404 })
    }

    const files = await query<{
      id: string
      language: string
      language_label: string | null
      pdf_url: string
      file_size_bytes: string | null
    }>(
      `SELECT id, language, language_label, pdf_url, file_size_bytes
       FROM book_files
       WHERE book_id = $1
       ORDER BY
         CASE WHEN language = 'ar' THEN 0 ELSE 1 END,
         created_at ASC`,
      [id]
    )

    const related = await query<{
      id: string
      title: string
      author: string | null
      cover_image_url: string | null
      pages_count: number | null
      publish_date: string | null
      category: string | null
    }>(
      `SELECT id, title, author, cover_image_url, pages_count, publish_date, category
       FROM books
       WHERE is_published = TRUE
         AND id <> $1
         AND (
           ($2::text IS NOT NULL AND category = $2)
           OR ($3::text IS NOT NULL AND author = $3)
         )
       ORDER BY
         CASE WHEN category = $2 AND author = $3 THEN 0
              WHEN category = $2 THEN 1
              ELSE 2 END,
         created_at DESC
       LIMIT 6`,
      [id, book.category, book.author]
    )

    return NextResponse.json({ book, files, related })
  } catch (error) {
    console.error("[library] detail error:", error)
    return NextResponse.json({ error: "حدث خطأ في جلب الكتاب" }, { status: 500 })
  }
}
