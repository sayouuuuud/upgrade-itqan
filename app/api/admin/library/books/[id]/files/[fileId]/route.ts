import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { deleteFromStorage } from "@/lib/storage"

const ADMIN_ROLES: ("admin" | "academy_admin")[] = ["admin", "academy_admin"]

// DELETE /api/admin/library/books/[id]/files/[fileId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id, fileId } = await params

  try {
    const file = await queryOne<{ pdf_key: string | null }>(
      `SELECT pdf_key FROM book_files WHERE id = $1 AND book_id = $2`,
      [fileId, id]
    )
    if (!file) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 })

    await query(`DELETE FROM book_files WHERE id = $1 AND book_id = $2`, [fileId, id])
    if (file.pdf_key) {
      await deleteFromStorage(file.pdf_key).catch(() => null)
    }
    await query(`UPDATE books SET updated_at = NOW() WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/library] file delete error:", error)
    return NextResponse.json({ error: "حدث خطأ في حذف الملف" }, { status: 500 })
  }
}
