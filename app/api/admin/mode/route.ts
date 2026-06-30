import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  ADMIN_MODE_COOKIE,
  allowedModesForRole,
  resolveAdminMode,
  type AdminMode,
} from "@/lib/admin/roles"

// GET /api/admin/mode — current effective mode + which modes are available.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const academyRoles = session.academy_roles ?? []
  const allowed = allowedModesForRole(session.role, academyRoles)
  if (allowed.length === 0) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const cookieValue = req.cookies.get(ADMIN_MODE_COOKIE)?.value
  const mode = resolveAdminMode(cookieValue, session.role, academyRoles)

  return NextResponse.json({ mode, allowed, role: session.role })
}

// PUT /api/admin/mode — switch the Super Admin's active mode.
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const academyRoles = session.academy_roles ?? []
  const allowed = allowedModesForRole(session.role, academyRoles)

  const body = await req.json().catch(() => ({}))
  const requested = body?.mode as AdminMode | undefined

  if (!requested || !allowed.includes(requested)) {
    return NextResponse.json({ error: "وضع غير مسموح" }, { status: 400 })
  }

  const res = NextResponse.json({ mode: requested })
  res.cookies.set(ADMIN_MODE_COOKIE, requested, {
    httpOnly: false, // read by the client shell to render the indicator
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
