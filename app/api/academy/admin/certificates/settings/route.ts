import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getAllSettings, upsertSetting } from "@/lib/certificates"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

// GET — return key/value object for all certificate settings for this scope
export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const settings = await getAllSettings(SCOPE)
  return NextResponse.json({ settings })
}

// PUT — body: { settings: { key1: value1, key2: value2 } }
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body || typeof body.settings !== "object" || body.settings === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const updates = body.settings as Record<string, unknown>
  for (const [key, value] of Object.entries(updates)) {
    if (key.length > 80) continue
    await upsertSetting(SCOPE, key, value, session.sub)
  }

  const settings = await getAllSettings(SCOPE)
  return NextResponse.json({ settings, ok: true })
}
