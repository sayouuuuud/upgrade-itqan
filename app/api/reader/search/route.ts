import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

// Roles that bypass gender segregation
const BYPASS_GENDER_ROLES = ['admin', 'reciter_supervisor', 'student_supervisor']

export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'reader') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const searchQuery = searchParams.get('q') || ''

        if (!searchQuery) {
            return NextResponse.json({ students: [] })
        }

        // Check if user role bypasses gender filter
        const bypassGenderFilter = BYPASS_GENDER_ROLES.includes(session.role)

        let genderFilter = ""
        const queryParams: unknown[] = [`%${searchQuery}%`]

        if (!bypassGenderFilter) {
            // Get the logged-in reader's gender
            const reader = await db.queryOne<{ gender: string }>(
                `SELECT gender FROM users WHERE id = $1`,
                [session.sub]
            )

            if (reader?.gender) {
                genderFilter = `AND u.gender = $2`
                queryParams.push(reader.gender)
            }
        }

        // Search for students (filtered by gender) + find their latest recitation
        const students = await db.query<any>(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.avatar_url,
        u.gender,
        (SELECT r.created_at FROM recitations r WHERE r.student_id = u.id ORDER BY r.created_at DESC LIMIT 1) as last_recitation_at,
        (SELECT r.status FROM recitations r WHERE r.student_id = u.id ORDER BY r.created_at DESC LIMIT 1) as last_recitation_status
      FROM users u
      WHERE u.role = 'student' 
      AND (u.name ILIKE $1 OR u.email ILIKE $1)
      ${genderFilter}
      LIMIT 10
    `, queryParams)

        return NextResponse.json({ students })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
