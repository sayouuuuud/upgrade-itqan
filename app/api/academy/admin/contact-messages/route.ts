import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ALLOWED_ROLES: ("admin" | "academy_admin" | "supervisor" | "student_supervisor")[] = [
    "admin",
    "academy_admin",
    "supervisor",
    "student_supervisor",
]

// GET /api/academy/admin/contact-messages
export async function GET() {
    const session = await getSession()
    if (!requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const messages = await query(
            `SELECT * FROM contact_messages ORDER BY created_at DESC`
        )
        return NextResponse.json({ messages })
    } catch (error) {
        console.error("Admin contact messages GET error:", error)
        return NextResponse.json({ error: "حدث خطأ في جلب الرسائل" }, { status: 500 })
    }
}

// PATCH /api/academy/admin/contact-messages
export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const { id, status } = await req.json()
        if (!id || !status) {
            return NextResponse.json({ error: "id and status are required" }, { status: 400 })
        }

        await query(
            `UPDATE contact_messages SET status = $1, updated_at = NOW() WHERE id = $2`,
            [status, id]
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin contact messages PATCH error:", error)
        return NextResponse.json({ error: "حدث خطأ في تحديث الرسالة" }, { status: 500 })
    }
}

// DELETE /api/academy/admin/contact-messages?id=...
export async function DELETE(req: NextRequest) {
    const session = await getSession()
    if (!requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 })
        }

        await query(`DELETE FROM contact_messages WHERE id = $1`, [id])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin contact messages DELETE error:", error)
        return NextResponse.json({ error: "حدث خطأ في حذف الرسالة" }, { status: 500 })
    }
}
