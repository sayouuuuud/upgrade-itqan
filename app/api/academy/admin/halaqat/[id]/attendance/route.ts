import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/halaqat/[id]/attendance
 * Get attendance records for a halaqah
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin', 'teacher', 'reader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  try {
    // Get all students in halaqah with their attendance for the specified date
    const attendance = await query<any>(
      `SELECT 
        hs.student_id,
        u.name as student_name,
        u.avatar_url,
        ha.id as attendance_id,
        ha.status,
        ha.notes,
        ha.created_at
      FROM halaqat_students hs
      JOIN users u ON u.id = hs.student_id
      LEFT JOIN halaqat_attendance ha ON ha.student_id = hs.student_id 
        AND ha.halaqah_id = $1 
        AND DATE(ha.session_date) = $2
      WHERE hs.halaqah_id = $1 AND hs.is_active = true
      ORDER BY u.name`,
      [id, date]
    )

    return NextResponse.json({ attendance, date })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/academy/admin/halaqat/[id]/attendance
 * Record attendance for students in a halaqah
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin', 'teacher', 'reader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { date, records } = body

  // records: [{ student_id, status: 'present' | 'absent' | 'late' | 'excused', notes? }]

  if (!date || !records || !Array.isArray(records)) {
    return NextResponse.json({ error: 'Date and records required' }, { status: 400 })
  }

  try {
    for (const record of records) {
      const { student_id, status, notes } = record
      
      if (!student_id || !status) continue

      // Check if record exists for this date
      const existing = await query<any>(
        `SELECT id FROM halaqat_attendance 
         WHERE halaqah_id = $1 AND student_id = $2 AND DATE(session_date) = $3`,
        [id, student_id, date]
      )

      if (existing.length > 0) {
        // Update existing record
        await query(
          `UPDATE halaqat_attendance 
           SET status = $1, notes = $2, updated_at = NOW()
           WHERE id = $3`,
          [status, notes || null, existing[0].id]
        )
      } else {
        // Create new record
        await query(
          `INSERT INTO halaqat_attendance (halaqah_id, student_id, session_date, status, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [id, student_id, date, status, notes || null]
        )
      }
    }

    return NextResponse.json({ success: true, message: 'Attendance recorded' })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
