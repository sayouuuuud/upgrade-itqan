import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/bookings/available-slots?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["student"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const readerId = searchParams.get("readerId")

  if (!date) {
    return NextResponse.json({ error: "التاريخ مطلوب" }, { status: 400 })
  }

  // Get student's gender
  const studentRows = await query<{ gender: string }>(
    `SELECT gender FROM users WHERE id = $1`, [session.sub]
  )
  const studentGender = studentRows[0]?.gender

  let genderFilter = ""
  const queryParams: unknown[] = [date]

  if (studentGender) {
    genderFilter = `AND (u.gender = $${queryParams.length + 1} OR u.gender IS NULL)`
    queryParams.push(studentGender)
  }

  let readerFilter = ""
  if (readerId) {
    readerFilter = `AND u.id = $${queryParams.length + 1}`
    queryParams.push(readerId)
  }

  // Get all availability slots for the given date:
  // - Recurring slots: match day_of_week
  // - Specific date slots: match exact date
  const slots = await query(
    `SELECT a.id, a.day_of_week, a.start_time, a.end_time, a.slot_duration_minutes, u.id as reader_id, u.name as reader_name
     FROM availability_slots a
     JOIN users u ON u.id = a.reader_id
     WHERE a.is_available = true
       AND u.is_active = true
       AND u.approval_status IN ('approved', 'auto_approved')
       ${genderFilter}
       ${readerFilter}
       AND (
         (a.is_recurring = true AND a.specific_date IS NULL AND a.day_of_week = EXTRACT(DOW FROM $1::date)::int)
         OR
         (a.is_recurring = false AND a.specific_date = $1::date)
       )
       AND NOT EXISTS (
         SELECT 1 FROM bookings b 
         WHERE b.reader_id = a.reader_id 
           AND b.slot_start::date = $1::date
           AND b.slot_start::time = a.start_time
           AND b.status IN ('pending', 'confirmed')
       )
     ORDER BY a.start_time`,
    queryParams
  )

  return NextResponse.json({ slots })
}

