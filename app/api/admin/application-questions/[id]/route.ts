import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const ADMIN_ROLES = ["admin", "academy_admin"]
const ALLOWED_TYPES = ["text", "textarea", "select", "audio", "file"]

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const updates: string[] = []
    const values: any[] = []
    const push = (col: string, v: any) => {
        values.push(v)
        updates.push(`${col} = $${values.length}`)
    }

    if (body.label !== undefined) push("label", String(body.label).trim())
    if (body.description !== undefined) push("description", body.description ?? null)
    if (body.type !== undefined) {
        if (!ALLOWED_TYPES.includes(body.type)) {
            return NextResponse.json({ error: "النوع غير مدعوم" }, { status: 400 })
        }
        push("type", body.type)
    }
    if (body.options !== undefined) push("options", body.options ? JSON.stringify(body.options) : null)
    if (body.is_required !== undefined) push("is_required", !!body.is_required)
    if (body.sort_order !== undefined) push("sort_order", Number(body.sort_order) || 0)
    if (body.is_active !== undefined) push("is_active", !!body.is_active)

    if (updates.length === 0) {
        return NextResponse.json({ error: "لا توجد تعديلات" }, { status: 400 })
    }

    values.push(id)
    const rows = await query<any>(
        `UPDATE application_questions SET ${updates.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length}
          RETURNING *`,
        values
    )
    if (rows.length === 0) return NextResponse.json({ error: "غير موجود" }, { status: 404 })
    return NextResponse.json({ data: rows[0] })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params
    await query(`DELETE FROM application_questions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
}
