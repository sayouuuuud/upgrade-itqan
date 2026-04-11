import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'reader') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q') || ''

        if (!query) {
            return NextResponse.json({ students: [] })
        }

        // Search for students + find their latest recitation
        const students = await db.query<any>(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.avatar_url,
        (SELECT r.created_at FROM recitations r WHERE r.student_id = u.id ORDER BY r.created_at DESC LIMIT 1) as last_recitation_at,
        (SELECT r.status FROM recitations r WHERE r.student_id = u.id ORDER BY r.created_at DESC LIMIT 1) as last_recitation_status
      FROM users u
      WHERE u.role = 'student' 
      AND (u.name ILIKE $1 OR u.email ILIKE $1)
      LIMIT 10
    `, [`%${query}%`])

        return NextResponse.json({ students })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
