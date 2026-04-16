import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch issued certificates from academy_certificates table, falling back gracefully
    const rows = await query<{
      id: string
      course_name: string
      teacher_name: string
      issue_date: string
      pdf_url: string | null
    }>(`
      SELECT
        cert.id,
        c.title as course_name,
        u.name as teacher_name,
        cert.issued_at as issue_date,
        cert.pdf_url
      FROM academy_certificates cert
      JOIN courses c ON cert.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE cert.student_id = $1
      ORDER BY cert.issued_at DESC
    `, [session.sub]).catch(() => [])

    return NextResponse.json({ certificates: rows })
  } catch (error) {
    console.error('[API] Error fetching certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

