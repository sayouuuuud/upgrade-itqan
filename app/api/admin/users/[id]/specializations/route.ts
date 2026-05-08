import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const VALID = ["sira", "fiqh", "aqeedah", "tajweed", "tafseer", "arabic"] as const
type Spec = (typeof VALID)[number]

type Params = { params: Promise<{ id: string }> }

// GET — return all specializations for a user (admin view)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || !["admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const rows = await query<{ specialization: string; set_by: string; created_at: string }>(
    `SELECT specialization, set_by, created_at FROM user_specializations WHERE user_id = $1 ORDER BY created_at`,
    [id]
  )

  return NextResponse.json({ specializations: rows })
}

// POST — admin adds a specialization (set_by = 'admin')
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || !["admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { specialization } = await req.json()

  if (!VALID.includes(specialization as Spec)) {
    return NextResponse.json({ error: "تخصص غير صالح" }, { status: 400 })
  }

  await query(
    `INSERT INTO user_specializations (user_id, specialization, set_by)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (user_id, specialization) DO UPDATE SET set_by = 'admin'`,
    [id, specialization]
  )

  return NextResponse.json({ success: true })
}

// DELETE — admin removes any specialization regardless of set_by
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || !["admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { specialization } = await req.json()

  await query(
    `DELETE FROM user_specializations WHERE user_id = $1 AND specialization = $2`,
    [id, specialization]
  )

  return NextResponse.json({ success: true })
}
