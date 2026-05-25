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
      category_id: string | null
      category_name: string | null
      category_slug: string | null
      is_published: boolean
      created_at: string
      library_domain: string
    }>(
      `SELECT b.id, b.title, b.author, b.description, b.cover_image_url,
              b.pages_count, b.publish_date, b.category, b.category_id,
              c.name AS category_name, c.slug AS category_slug,
              b.is_published, b.created_at, b.library_domain
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.id = $1 AND b.is_published = TRUE`,
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

    // Related books: prefer same category + same author, then same category,
    // then same author, then any other book in the same library_domain.
    // If the current book has neither category nor author set we still
    // surface other books in the same library so the section never goes
    // empty when there are other books to show.
    const related = await query<{
      id: string
      title: string
      author: string | null
      cover_image_url: string | null
      pages_count: number | null
      publish_date: string | null
      category: string | null
      category_id: string | null
      category_name: string | null
    }>(
      `SELECT b.id, b.title, b.author, b.cover_image_url, b.pages_count,
              b.publish_date, b.category, b.category_id, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.is_published = TRUE
         AND b.id <> $1
         AND ($4::text IS NULL OR b.library_domain IS NULL OR b.library_domain = $4)
       ORDER BY
         CASE
           WHEN $2::uuid IS NOT NULL AND b.category_id = $2
                AND $3::text IS NOT NULL AND b.author = $3 THEN 0
           WHEN $2::uuid IS NOT NULL AND b.category_id = $2 THEN 1
           WHEN $3::text IS NOT NULL AND b.author = $3 THEN 2
           ELSE 3
         END,
         b.created_at DESC
       LIMIT 6`,
      [id, book.category_id, book.author, book.library_domain]
    )

    return NextResponse.json({ book, files, related })
  } catch (error) {
    console.error("[library] detail error:", error)
    return NextResponse.json({ error: "حدث خطأ في جلب الكتاب" }, { status: 500 })
  }
}
