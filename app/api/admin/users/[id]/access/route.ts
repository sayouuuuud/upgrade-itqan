import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// PATCH /api/admin/users/[id]/access — update platform access for a user
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session || (session.role !== 'admin' && session.role !== 'academy_admin')) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()

        const updates: string[] = []
        const values: unknown[] = []

        if (body.has_quran_access !== undefined) {
            values.push(body.has_quran_access)
            updates.push(`has_quran_access = $${values.length}`)
        }
        if (body.has_academy_access !== undefined) {
            values.push(body.has_academy_access)
            updates.push(`has_academy_access = $${values.length}`)
        }
        if (body.platform_preference !== undefined) {
            values.push(body.platform_preference)
            updates.push(`platform_preference = $${values.length}`)
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 })
        }

        values.push(id)
        const result = await query(
            `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, has_quran_access, has_academy_access, platform_preference`,
            values
        )

        if (!result.length) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
        }

        return NextResponse.json({ user: result[0] })
    } catch (error) {
        console.error("Access control update error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
