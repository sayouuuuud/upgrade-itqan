import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const ADMIN_ROLES = ["admin", "academy_admin"]
const ALLOWED_TYPES = ["text", "textarea", "select", "audio", "file"]
const ALLOWED_TARGETS = ["teacher", "reader"]

/**
 * GET /api/admin/application-questions
 * Optional ?role=teacher|reader filter; otherwise returns both.
 * Public for any authenticated applicant too (so the dashboard can use it),
 * we just gate write operations.
 */
export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const url = new URL(req.url)
    const role = url.searchParams.get("role")
    const params: any[] = []
    let where = ""
    if (role && ALLOWED_TARGETS.includes(role)) {
        params.push(role)
        where = `WHERE role_target = $${params.length}`
    }

    const rows = await query<any>(
        `SELECT id, role_target, label, description, type, options, is_required, sort_order, is_active, created_at
           FROM application_questions
           ${where}
          ORDER BY role_target, sort_order ASC, created_at ASC`,
        params
    )
    return NextResponse.json({ data: rows })
}

/**
 * POST /api/admin/application-questions  (admin only)
 * Body: { role_target, label, description?, type, options?, is_required?, sort_order? }
 */
export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || !ADMIN_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await req.json()
    const { role_target, label, description, type, options, is_required, sort_order } = body

    if (!ALLOWED_TARGETS.includes(role_target)) {
        return NextResponse.json({ error: "role_target غير صحيح" }, { status: 400 })
    }
    if (!label || typeof label !== "string" || !label.trim()) {
        return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(type)) {
        return NextResponse.json({ error: "النوع غير مدعوم" }, { status: 400 })
    }

    const rows = await query<any>(
        `INSERT INTO application_questions
            (role_target, label, description, type, options, is_required, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            role_target,
            label.trim(),
            description ?? null,
            type,
            options ? JSON.stringify(options) : null,
            !!is_required,
            sort_order ?? 0,
        ]
    )
    return NextResponse.json({ data: rows[0] })
}
