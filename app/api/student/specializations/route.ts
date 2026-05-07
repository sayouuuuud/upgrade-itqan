import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const VALID = ["sira", "fiqh", "aqeedah", "tajweed", "tafseer", "arabic"] as const
type Spec = (typeof VALID)[number]

// GET — return the student's current specializations
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await query<{ specialization: string; set_by: string }>(
    `SELECT specialization, set_by FROM user_specializations WHERE user_id = $1 ORDER BY created_at`,
    [session.id]
  )

  return NextResponse.json({ specializations: rows })
}

// POST — add a specialization (student adds their own, set_by = 'self')
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { specialization } = await req.json()

  if (!VALID.includes(specialization as Spec)) {
    return NextResponse.json({ error: "تخصص غير صالح" }, { status: 400 })
  }

  await query(
    `INSERT INTO user_specializations (user_id, specialization, set_by)
     VALUES ($1, $2, 'self')
     ON CONFLICT (user_id, specialization) DO NOTHING`,
    [session.id, specialization]
  )

  return NextResponse.json({ success: true })
}

// DELETE — remove a specialization the student added themselves
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { specialization } = await req.json()

  // Students can only remove what they (or no one restricted) set
  // They cannot remove admin/parent-set specializations
  const rows = await query<{ set_by: string }>(
    `SELECT set_by FROM user_specializations WHERE user_id = $1 AND specialization = $2`,
    [session.id, specialization]
  )

  if (rows.length === 0) return NextResponse.json({ success: true })

  if (rows[0].set_by !== "self") {
    return NextResponse.json(
      { error: "لا يمكنك حذف تخصص حدده المشرف أو ولي الأمر" },
      { status: 403 }
    )
  }

  await query(
    `DELETE FROM user_specializations WHERE user_id = $1 AND specialization = $2`,
    [session.id, specialization]
  )

  return NextResponse.json({ success: true })
}
