import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // Pull the latest teacher_application row per user so we can show the
    // application status (pending / approved / rejected) and rejection reason
    // alongside the user's approval_status column.
    //
    // NOTE: We intentionally do NOT reference teacher_applications.submitted_at
    // here because not every production database has run migration 020 yet,
    // and the column may not exist. We use created_at for both ordering and
    // the timestamp shown to admins -- it is part of the base schema.
    const rows = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.gender,
        u.is_active,
        u.approval_status,
        u.reapply_blocked,
        u.created_at,
        COUNT(DISTINCT c.id)::int AS courses_count,
        COUNT(DISTINCT e.student_id)::int AS total_students,
        latest_app.status AS application_status,
        latest_app.rejection_reason,
        latest_app.app_submitted_at AS submitted_at,
        rejection_stats.rejection_count,
        rejection_stats.last_rejected_at
      FROM users u
      LEFT JOIN courses c ON u.id = c.teacher_id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      LEFT JOIN LATERAL (
        SELECT ta.status, ta.rejection_reason,
               COALESCE(ta.submitted_at, ta.created_at) AS app_submitted_at
        FROM teacher_applications ta
        WHERE ta.user_id = u.id
        ORDER BY ta.created_at DESC
        LIMIT 1
      ) latest_app ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS rejection_count,
          MAX(COALESCE(ta2.rejected_at, ta2.reviewed_at)) AS last_rejected_at
        FROM teacher_applications ta2
        WHERE ta2.user_id = u.id AND ta2.status = 'rejected'
      ) rejection_stats ON TRUE
      WHERE u.role = 'teacher'
      GROUP BY u.id, latest_app.status, latest_app.rejection_reason, latest_app.app_submitted_at,
               rejection_stats.rejection_count, rejection_stats.last_rejected_at
      ORDER BY u.created_at DESC
    `)

    // Fetch rejection dates separately for each teacher
    const teacherIds = rows.map((r: any) => r.id)
    const rejectionDatesMap = new Map<string, string[]>()
    
    if (teacherIds.length > 0) {
      const rejectionDates = await query(`
        SELECT user_id,
               JSON_AGG(
                 COALESCE(rejected_at, reviewed_at)
                 ORDER BY COALESCE(rejected_at, reviewed_at) DESC
               ) FILTER (WHERE COALESCE(rejected_at, reviewed_at) IS NOT NULL) AS dates
        FROM teacher_applications
        WHERE user_id = ANY($1) AND status = 'rejected'
        GROUP BY user_id
      `, [teacherIds])
      
      for (const rd of rejectionDates) {
        rejectionDatesMap.set((rd as any).user_id, (rd as any).dates || [])
      }
    }

    // Add rejection_dates to each teacher record
    const rowsWithDates = rows.map((r: any) => ({
      ...r,
      rejection_dates: rejectionDatesMap.get(r.id) || []
    }))

    return NextResponse.json({ data: rowsWithDates })
  } catch (error: any) {
    // Surface the underlying DB error message in development / preview builds
    // so the admin UI can show something useful when something goes wrong.
    // In production we still keep the message generic.
    console.error('Error fetching teachers:', error)
    const detail = process.env.NODE_ENV !== 'production'
      ? (error?.message || String(error))
      : undefined
    return NextResponse.json(
      { error: 'Internal server error', detail },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { name, email, password, gender, specialization } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    const VALID_SPECS = ["sira", "fiqh", "aqeedah", "tajweed", "tafseer", "arabic"]

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)

    // Create user with teacher role – auto-approve since an admin is adding them
    const result = await query(`
      INSERT INTO users (name, email, password_hash, role, gender, is_active, has_academy_access, approval_status, created_at)
      VALUES ($1, $2, $3, 'teacher', $4, true, true, 'approved', NOW())
      RETURNING id, name, email, role, gender, is_active, has_academy_access, approval_status, created_at
    `, [name, email.toLowerCase().trim(), password_hash, gender || 'male'])

    // Save specialization if provided
    if (specialization && VALID_SPECS.includes(specialization)) {
      await query(
        `INSERT INTO user_specializations (user_id, specialization, set_by)
         VALUES ($1, $2, 'self')
         ON CONFLICT (user_id, specialization) DO NOTHING`,
        [result[0].id, specialization]
      )
    }

    return NextResponse.json({ data: { ...result[0], specialization: specialization || null } }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating teacher:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
