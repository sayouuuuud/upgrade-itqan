import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

type LogRow = {
  id: string
  log_date: string
  new_verses: number
  revised_verses: number
  surah_number: number | null
  surah_name: string | null
  juz_number: number | null
  notes: string | null
  quality_rating: number | null
  created_at: string
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get("days") || "30", 10)
  const limit = Math.min(Math.max(days, 7), 365)

  const logs = await query<LogRow>(
    `SELECT id, log_date, new_verses, revised_verses, surah_number, surah_name,
            juz_number, notes, quality_rating, created_at
     FROM memorization_log
     WHERE student_id = $1 AND log_date >= CURRENT_DATE - $2::int
     ORDER BY log_date DESC`,
    [session.sub, limit]
  )

  return NextResponse.json({ logs })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    new_verses = 0,
    revised_verses = 0,
    surah_number = null,
    surah_name = null,
    juz_number = null,
    notes = null,
    quality_rating = null,
    log_date = null,
  } = body as {
    new_verses?: number
    revised_verses?: number
    surah_number?: number | null
    surah_name?: string | null
    juz_number?: number | null
    notes?: string | null
    quality_rating?: number | null
    log_date?: string | null
  }

  if (new_verses < 0 || revised_verses < 0) {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 })
  }

  if (new_verses === 0 && revised_verses === 0) {
    return NextResponse.json({ error: "At least one field must be > 0" }, { status: 400 })
  }

  const dateValue = log_date || new Date().toISOString().split("T")[0]

  const rows = await query<{ id: string }>(
    `INSERT INTO memorization_log
       (student_id, log_date, new_verses, revised_verses, surah_number, surah_name, juz_number, notes, quality_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [session.sub, dateValue, new_verses, revised_verses, surah_number, surah_name, juz_number, notes, quality_rating]
  )

  return NextResponse.json({ success: true, id: rows[0]?.id }, { status: 201 })
}
