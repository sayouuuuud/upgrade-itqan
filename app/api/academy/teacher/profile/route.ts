import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * GET /api/academy/teacher/profile
 *
 * Returns the academy teacher profile (bio, specialization, certifications,
 * subjects, etc) joined with the user record.
 */
export async function GET() {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const row = await queryOne<{
      id: string
      name: string
      email: string
      phone: string | null
      avatar_url: string | null
      bio: string | null
      specialization: string | null
      years_of_experience: number | null
      certifications: string[] | null
      subjects: string[] | null
      total_students: number | null
      total_courses: number | null
      rating: number | null
      is_verified: boolean | null
      is_accepting_students: boolean | null
    }>(
      `
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url,
             at.bio, at.specialization, at.years_of_experience,
             at.certifications, at.subjects,
             at.total_students, at.total_courses, at.rating,
             at.is_verified, at.is_accepting_students
      FROM users u
      LEFT JOIN academy_teachers at ON at.user_id = u.id
      WHERE u.id = $1
      `,
      [session.sub]
    )

    if (!row) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('[API] teacher/profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/academy/teacher/profile
 *
 * Updates the academy_teachers row for the teacher (creating one if missing).
 *
 * Accepted body fields:
 *   - bio (text)
 *   - specialization (text)
 *   - years_of_experience (number)
 *   - certifications (string[])
 *   - subjects (string[])
 *   - is_accepting_students (boolean)
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const {
      bio,
      specialization,
      years_of_experience,
      certifications,
      subjects,
      is_accepting_students,
    } = body || {}

    const certsArr = Array.isArray(certifications)
      ? certifications.filter((c) => typeof c === 'string').map((c: string) => c.trim()).filter(Boolean)
      : null

    const subjectsArr = Array.isArray(subjects)
      ? subjects.filter((s) => typeof s === 'string').map((s: string) => s.trim()).filter(Boolean)
      : null

    // Upsert the academy_teachers row
    await query(
      `
      INSERT INTO academy_teachers
        (user_id, bio, specialization, years_of_experience, certifications, subjects, is_accepting_students)
      VALUES ($1, $2, $3, $4, COALESCE($5, '{}'), COALESCE($6, '{}'), COALESCE($7, TRUE))
      ON CONFLICT (user_id) DO UPDATE SET
        bio                  = COALESCE(EXCLUDED.bio, academy_teachers.bio),
        specialization       = COALESCE(EXCLUDED.specialization, academy_teachers.specialization),
        years_of_experience  = COALESCE(EXCLUDED.years_of_experience, academy_teachers.years_of_experience),
        certifications       = CASE WHEN $5::text[] IS NULL THEN academy_teachers.certifications ELSE EXCLUDED.certifications END,
        subjects             = CASE WHEN $6::text[] IS NULL THEN academy_teachers.subjects        ELSE EXCLUDED.subjects        END,
        is_accepting_students= COALESCE(EXCLUDED.is_accepting_students, academy_teachers.is_accepting_students),
        updated_at           = NOW()
      `,
      [
        session.sub,
        typeof bio === 'string' ? bio : null,
        typeof specialization === 'string' ? specialization : null,
        Number.isFinite(Number(years_of_experience)) ? Number(years_of_experience) : null,
        certsArr,
        subjectsArr,
        typeof is_accepting_students === 'boolean' ? is_accepting_students : null,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] teacher/profile PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
