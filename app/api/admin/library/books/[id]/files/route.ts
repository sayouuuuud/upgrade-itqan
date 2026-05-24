import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

const ADMIN_ROLES: ("admin" | "academy_admin")[] = ["admin", "academy_admin"]

// POST /api/admin/library/books/[id]/files
// Body: { language, language_label?, pdf_url, pdf_key?, file_size_bytes? }
// Upserts a single language file for the book (one PDF per language).
export async function POST(
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
    const language = (body?.language || "").toString().trim()
    const languageLabel = body?.language_label
      ? body.language_label.toString().trim().slice(0, 120)
      : null
    const pdfUrl = (body?.pdf_url || "").toString().trim()
    const pdfKey = body?.pdf_key ? body.pdf_key.toString().trim() : null
    const sizeRaw = body?.file_size_bytes
    const size = Number.isFinite(Number(sizeRaw)) ? Number(sizeRaw) : null

    if (!language) {
      return NextResponse.json({ error: "يجب اختيار اللغة" }, { status: 400 })
    }
    if (!pdfUrl) {
      return NextResponse.json({ error: "رابط الملف مطلوب" }, { status: 400 })
    }

    // Make sure the book exists
    const book = await queryOne<{ id: string }>(
      `SELECT id FROM books WHERE id = $1`,
      [id]
    )
    if (!book) return NextResponse.json({ error: "الكتاب غير موجود" }, { status: 404 })

    const rows = await query<{ id: string }>(
      `INSERT INTO book_files (book_id, language, language_label, pdf_url, pdf_key, file_size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (book_id, language)
       DO UPDATE SET
         language_label = EXCLUDED.language_label,
         pdf_url = EXCLUDED.pdf_url,
         pdf_key = EXCLUDED.pdf_key,
         file_size_bytes = EXCLUDED.file_size_bytes
       RETURNING id`,
      [id, language, languageLabel, pdfUrl, pdfKey, size]
    )

    await query(`UPDATE books SET updated_at = NOW() WHERE id = $1`, [id])

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (error) {
    console.error("[admin/library] file upsert error:", error)
    return NextResponse.json({ error: "حدث خطأ في حفظ الملف" }, { status: 500 })
  }
}
