import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const isAuthorized = session && (session.role === 'teacher' || session.role === 'reader' || session.role === 'admin')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    // 1. Check permissions
    const pathCheck = await query<any>(`
      SELECT id, title, total_stages, created_by, manager_id 
      FROM tajweed_paths 
      WHERE id = $1 LIMIT 1
    `, [id])

    if (pathCheck.length === 0) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }

    const path = pathCheck[0]
    const isManager = session.role === 'admin' || path.created_by === session.sub || path.manager_id === session.sub
    if (!isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Fetch general stats
    const statsQuery = await query<any>(`
      SELECT 
        COUNT(id)::int as enrolled_students,
        COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0)::int as active_students,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0)::int as completed_students,
        COALESCE(SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END), 0)::int as dropped_students,
        COALESCE(AVG(CASE WHEN $2 > 0 THEN (stages_completed::float / $2) * 100 ELSE 0 END), 0)::float as avg_progress_percent
      FROM tajweed_path_enrollments
      WHERE path_id = $1
    `, [id, path.total_stages])
    
    const generalStats = statsQuery[0] || {
      enrolled_students: 0,
      active_students: 0,
      completed_students: 0,
      dropped_students: 0,
      avg_progress_percent: 0
    }

    // 3. Fetch conversion funnel for stages
    const funnelStages = await query<any>(`
      SELECT 
        ts.id, 
        ts.position, 
        ts.title,
        COALESCE(SUM(CASE WHEN tpp.status <> 'locked' THEN 1 ELSE 0 END), 0)::int as started_count,
        COALESCE(SUM(CASE WHEN tpp.status = 'completed' THEN 1 ELSE 0 END), 0)::int as completed_count
      FROM tajweed_path_stages ts
      LEFT JOIN tajweed_path_enrollments tpe ON tpe.path_id = ts.path_id
      LEFT JOIN tajweed_path_progress tpp ON tpp.stage_id = ts.id AND tpp.enrollment_id = tpe.id
      WHERE ts.path_id = $1
      GROUP BY ts.id, ts.position, ts.title
      ORDER BY ts.position ASC
    `, [id])

    // 4. Fetch top 10 students
    const topStudents = await query<any>(`
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.image as student_image,
        tpe.stages_completed,
        tpe.last_activity_at,
        CASE WHEN $2 > 0 THEN ROUND((tpe.stages_completed::float / $2) * 100) ELSE 0 END::int as progress_percent
      FROM tajweed_path_enrollments tpe
      JOIN users u ON u.id = tpe.student_id
      WHERE tpe.path_id = $1
      ORDER BY tpe.stages_completed DESC, tpe.last_activity_at DESC
      LIMIT 10
    `, [id, path.total_stages])

    return NextResponse.json({
      data: {
        path: {
          id: path.id,
          title: path.title,
          total_stages: path.total_stages
        },
        stats: generalStats,
        funnel: funnelStages,
        top_students: topStudents
      }
    })
  } catch (error) {
    console.error('Error fetching path stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
