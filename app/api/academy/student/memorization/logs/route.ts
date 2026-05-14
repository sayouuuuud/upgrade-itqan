import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

  try {
    const rows = await query(`
      SELECT 
        ml.id,
        ml.surah_number,
        ml.surah_name,
        ml.juz_number,
        ml.new_verses as ayah_from,
        ml.revised_verses as ayah_to,
        CASE 
          WHEN ml.quality_rating = 5 THEN 'excellent'
          WHEN ml.quality_rating = 4 THEN 'good'
          WHEN ml.quality_rating = 3 THEN 'acceptable'
          ELSE 'needs_review'
        END as quality,
        0 as points_earned,
        ml.log_date as logged_at,
        ml.notes
      FROM memorization_log ml
      WHERE ml.student_id = $1
      ORDER BY ml.log_date DESC, ml.created_at DESC
      LIMIT $2
    `, [session.sub, limit])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching memorization logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
