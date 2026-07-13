import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

function isSuperAdmin(session: any): boolean {
  return session?.role === "admin" || session?.role === "super_admin"
}

// POST /api/admin/content-pages/[slug]/reset
// Restores all editable fields from the stored default_* snapshot columns
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  const { slug } = await params

  try {
    const rows = await query<{ slug: string }>(
      `UPDATE content_pages
       SET
         title_ar     = default_title_ar,
         title_en     = default_title_en,
         content_ar   = default_content_ar,
         content_en   = default_content_en,
         meta_desc_ar = default_meta_desc_ar,
         meta_desc_en = default_meta_desc_en,
         is_published = true,
         updated_by   = $1,
         updated_at   = NOW()
       WHERE slug = $2
       RETURNING slug`,
      [session.sub, slug]
    )

    if (!rows.length) {
      return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ContentPages] reset error:", error)
    return NextResponse.json({ error: "فشل في إعادة الضبط" }, { status: 500 })
  }
}
