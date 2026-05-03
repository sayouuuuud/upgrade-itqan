import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/halaqat/[id]/students
 * Get all students in a halaqah
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

  try {
    const students = await query<any>(
      `SELECT 
        hs.id as enrollment_id,
        hs.joined_at,
        hs.is_active,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.avatar_url,
        (
          SELECT COUNT(*) FROM halaqat_attendance ha 
          WHERE ha.student_id = u.id AND ha.halaqah_id = $1 AND ha.status = 'present'
        ) as attendance_count,
        (
          SELECT COUNT(*) FROM halaqat_attendance ha 
          WHERE ha.student_id = u.id AND ha.halaqah_id = $1
        ) as total_sessions
      FROM halaqat_students hs
      JOIN users u ON u.id = hs.student_id
      WHERE hs.halaqah_id = $1
      ORDER BY hs.joined_at DESC`,
      [id]
    )

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Error fetching halaqah students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/academy/admin/halaqat/[id]/students
 * Add a student to a halaqah
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
  const { student_id } = body

  if (!student_id) {
    return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
  }

  try {
    // Check if halaqah exists and has capacity
    const halaqah = await query<any>(
      `SELECT h.*, 
        (SELECT COUNT(*) FROM halaqat_students WHERE halaqah_id = h.id AND is_active = true) as current_count
      FROM halaqat h WHERE h.id = $1`,
      [id]
    )

    if (halaqah.length === 0) {
      return NextResponse.json({ error: 'Halaqah not found' }, { status: 404 })
    }

    if (halaqah[0].current_count >= halaqah[0].max_students) {
      return NextResponse.json({ error: 'Halaqah is full' }, { status: 400 })
    }

    // Check if student already enrolled
    const existing = await query<any>(
      `SELECT id FROM halaqat_students WHERE halaqah_id = $1 AND student_id = $2`,
      [id, student_id]
    )

    if (existing.length > 0) {
      // Reactivate if inactive
      await query(
        `UPDATE halaqat_students SET is_active = true WHERE halaqah_id = $1 AND student_id = $2`,
        [id, student_id]
      )
      return NextResponse.json({ success: true, message: 'Student reactivated in halaqah' })
    }

    // Add student
    await query(
      `INSERT INTO halaqat_students (halaqah_id, student_id, joined_at, is_active)
       VALUES ($1, $2, NOW(), true)`,
      [id, student_id]
    )

    return NextResponse.json({ success: true, message: 'Student added to halaqah' }, { status: 201 })
  } catch (error) {
    console.error('Error adding student to halaqah:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/academy/admin/halaqat/[id]/students
 * Remove a student from a halaqah
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin', 'teacher', 'reader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { student_id } = body

  if (!student_id) {
    return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
  }

  try {
    await query(
      `UPDATE halaqat_students SET is_active = false WHERE halaqah_id = $1 AND student_id = $2`,
      [id, student_id]
    )

    return NextResponse.json({ success: true, message: 'Student removed from halaqah' })
  } catch (error) {
    console.error('Error removing student from halaqah:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
