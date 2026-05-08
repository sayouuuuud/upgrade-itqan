import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// C-1: GET /api/academy/student/courses/all — browse all published courses
// يظهر كل الدورات المنشورة مع حالة الـ enrollment للطالب الحالي
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const categoryId = searchParams.get('category')
  const search = searchParams.get('search')
  const level = searchParams.get('level')

  try {
    const params: any[] = [session.sub]
    let whereExtra = ''

    // Fetch student's specializations for matching
    const studentSpecs = await query<{ specialization: string }>(
      `SELECT specialization FROM user_specializations WHERE user_id = $1`,
      [session.sub]
    )
    // If student has specializations, filter courses to matching ones (or courses with no specialization = general)
    if (studentSpecs.length > 0) {
      const specValues = studentSpecs.map(s => s.specialization)
      params.push(specValues)
      whereExtra += ` AND (c.specialization = ANY($${params.length}) OR c.specialization IS NULL OR c.specialization = 'general')`
    }

    if (categoryId) {
      params.push(categoryId)
      whereExtra += ` AND c.category_id = $${params.length}`
    }

    if (level) {
      params.push(level)
      whereExtra += ` AND COALESCE(c.difficulty_level, c.level, 'beginner') = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      whereExtra += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`
    }

    const q = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        COALESCE(c.difficulty_level, c.level, 'beginner') as level,
        c.status,
        c.created_at,
        COALESCE(cat.name, 'غير محدد') as category_name,
        c.category_id,
        COALESCE(u.name, 'غير محدد') as teacher_name,
        COUNT(DISTINCT l.id)::int as total_lessons,
        COUNT(DISTINCT e_all.id)::int as total_enrolled,
        -- enrollment status للطالب الحالي
        MAX(CASE WHEN e_me.student_id = $1 THEN e_me.status ELSE NULL END) as my_enrollment_status,
        MAX(CASE WHEN e_me.student_id = $1 THEN e_me.id::text ELSE NULL END) as my_enrollment_id
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id AND l.status = 'published'
      LEFT JOIN enrollments e_all ON e_all.course_id = c.id AND e_all.status = 'active'
      LEFT JOIN enrollments e_me ON e_me.course_id = c.id AND e_me.student_id = $1
      WHERE (c.status = 'published' OR c.is_published = true)
      ${whereExtra}
      GROUP BY c.id, c.title, c.description, c.thumbnail_url, c.difficulty_level, c.level, c.status, cat.name, c.category_id, u.name, c.created_at
      ORDER BY c.created_at DESC
    `

    const rows = await query<any>(q, params)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching all courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

