import { NextRequest, NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { ASSIGNABLE_PRIMARY_ROLES, ASSIGNABLE_ACADEMY_ROLES } from "@/lib/admin/roles"

const ASSIGNABLE_ACADEMY_IDS = ASSIGNABLE_ACADEMY_ROLES.map((r) => r.id)

// GET /api/admin/users/[id]/roles — a user's current primary + academy roles.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params
  const user = await queryOne<{
    id: string
    name: string
    email: string
    role: string
    academy_roles: string[] | null
  }>(
    `SELECT id, name, email, role, academy_roles FROM users WHERE id = $1`,
    [id]
  )

  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

  return NextResponse.json({
    user: { ...user, academy_roles: user.academy_roles ?? [] },
  })
}

// PUT /api/admin/users/[id]/roles — set primary role + secondary academy roles.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const role = String(body?.role ?? "")
  const academyRoles: string[] = Array.isArray(body?.academyRoles) ? body.academyRoles.map(String) : []

  if (!ASSIGNABLE_PRIMARY_ROLES.includes(role)) {
    return NextResponse.json({ error: "دور أساسي غير مسموح" }, { status: 400 })
  }

  // Drop any academy role that isn't in the allow-list to prevent privilege
  // escalation via crafted payloads.
  const cleanAcademyRoles = [...new Set(academyRoles.filter((r) => ASSIGNABLE_ACADEMY_IDS.includes(r)))]

  const existing = await queryOne<{ role: string; name: string }>(
    `SELECT role, name FROM users WHERE id = $1`,
    [id]
  )
  if (!existing) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

  // Guard: don't allow demoting the last remaining super admin.
  if (existing.role === "admin" && role !== "admin") {
    const others = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND id <> $1`,
      [id]
    )
    if (Number(others?.count ?? 0) === 0) {
      return NextResponse.json(
        { error: "لا يمكن إزالة آخر مدير عام في النظام" },
        { status: 400 }
      )
    }
  }

  await query(
    `UPDATE users
        SET role = $1,
            academy_roles = $2::varchar[],
            role_changed_by = $3,
            updated_at = NOW()
      WHERE id = $4`,
    [role, cleanAcademyRoles, session!.sub, id]
  )

  // Best-effort audit trail; ignore if the table/columns differ.
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
       VALUES ($1, 'change_user_roles', 'user', $2, $3)`,
      [
        session!.sub,
        id,
        `تغيير دور ${existing.name} من "${existing.role}" إلى "${role}" + أدوار: [${cleanAcademyRoles.join(", ")}]`,
      ]
    )
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, role, academyRoles: cleanAcademyRoles })
}
