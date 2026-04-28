import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    const session = await getSession()
    if (!session || !['student', 'teacher', 'admin', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const lessonId = (await params).lessonId;

        // Check if already completed
        const existing = await query(`SELECT id FROM lesson_progress WHERE lesson_id = $1 AND student_id = $2`, [lessonId, session.sub])
        if (existing.length > 0) {
            return NextResponse.json({ success: true, message: 'Lesson already completed' })
        }

        // Insert
        await query(`
      INSERT INTO lesson_progress (lesson_id, student_id, completed_at)
      VALUES ($1, $2, NOW())
    `, [lessonId, session.sub])

        return NextResponse.json({ success: true, message: 'Lesson marked as completed' })
    } catch (error) {
        console.error('[API] Error completing lesson:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
