import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
        if (!session || !allowedRoles.includes(session.role as any)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: userId } = await params

        const user = await db.queryOne<any>(
            `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.bio, u.is_active, u.created_at, u.last_login_at,
             EXISTS(
                SELECT 1 FROM user_sessions us 
                WHERE us.user_id = u.id 
                AND us.last_active_at > NOW() - INTERVAL '5 minutes'
             ) as is_online,
             rp.full_name_triple, rp.city, rp.qualification, rp.memorized_parts,
             rp.years_of_experience, rp.certificate_file_url, rp.specialization, rp.about_me,
             u.has_quran_access, u.has_academy_access, u.platform_preference
             FROM users u
             LEFT JOIN reader_profiles rp ON rp.user_id = u.id
             WHERE u.id = $1`,
            [userId]
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Access Control for Supervisors
        if (session.role === 'student_supervisor' && user.role !== 'student' && user.id !== session.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        if (session.role === 'reciter_supervisor' && user.role !== 'reader' && user.id !== session.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Fetch history based on user role
        let history: any[] = []
        if (user.role === 'student') {
            history = await db.query<any>(
                `SELECT 
                   r.id, 
                   r.surah_name, 
                   r.ayah_from, 
                   r.ayah_to, 
                   r.status, 
                   r.audio_url, 
                   rev.overall_score as overall_rating, 
                   r.created_at, 
                   reader.name as evaluator_name
                 FROM recitations r
                 LEFT JOIN users reader ON reader.id = r.assigned_reader_id
                 LEFT JOIN reviews rev ON rev.recitation_id = r.id
                 WHERE r.student_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT 50`,
                [userId]
            )
        } else if (user.role === 'reader') {
            history = await db.query<any>(
                `SELECT 
                   r.id, 
                   r.surah_name, 
                   r.ayah_from, 
                   r.ayah_to, 
                   r.status, 
                   r.audio_url, 
                   rev.overall_score as overall_rating, 
                   r.created_at, 
                   student.name as student_name
                 FROM recitations r
                 JOIN users student ON student.id = r.student_id
                 LEFT JOIN reviews rev ON rev.recitation_id = r.id
                 WHERE r.assigned_reader_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT 50`,
                [userId]
            )
        }

        // 2. Recitation Metrics
        const dailyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'1 day\'',
            [userId]
        )
        const weeklyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
            [userId]
        )
        const monthlyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'30 days\'',
            [userId]
        )

        // 3. Session Statistics (Bookings)
        // Completed Sessions
        const completedSessions = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'completed\'',
            [userId]
        )
        // Absences / No-Shows
        const noShows = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'no_show\'',
            [userId]
        )
        // Cancelled Sessions
        const cancelledSessions = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'cancelled\'',
            [userId]
        )

        // 4. Ratings (if user is a reader)
        let averageRating = 0
        if (user.role === 'reader') {
            const ratingRes = await db.queryOne<any>(
                'SELECT AVG(rating) as avg FROM reader_ratings WHERE reader_id = $1',
                [userId]
            )
            averageRating = parseFloat(ratingRes?.avg || "0")
        }

        // 5. Last tech session Info - fetch from activity_logs (login_success)
        const lastSession = await db.queryOne<any>(
            `SELECT ip_address, user_agent, created_at as last_active_at 
             FROM activity_logs 
             WHERE user_id = $1 AND action = 'login_success' 
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        )

        // 6. Fetch Country from page_views
        const countryRes = await db.queryOne<any>(
            'SELECT country FROM page_views WHERE user_id = $1 AND country IS NOT NULL ORDER BY created_at DESC LIMIT 1',
            [userId]
        )

        // 6b. Fetch Errors Log if student
        let errorsLog: any[] = []
        if (user.role === 'student') {
            errorsLog = await db.query<any>(
                `SELECT r.id as recitation_id, r.surah_name, rev.error_markers, rev.detailed_feedback, rev.created_at
               FROM reviews rev
               JOIN recitations r ON r.id = rev.recitation_id
               WHERE r.student_id = $1 AND (rev.error_markers IS NOT NULL AND rev.error_markers != '[]'::jsonb)
               ORDER BY rev.created_at DESC`,
                [userId]
            )
        }

        // 7. Activity Data (Last 14 days)
        const activityData = await db.query<any>(
            `SELECT 
                TO_CHAR(d, 'YYYY-MM-DD') as date,
                COUNT(r.id) as count
             FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') d
             LEFT JOIN recitations r ON DATE(r.created_at) = d AND r.student_id = $1
             GROUP BY d
             ORDER BY d ASC`,
            [userId]
        )

        return NextResponse.json({
            user,
            metrics: {
                recitations: {
                    daily: parseInt(dailyRec?.count || "0") || 0,
                    weekly: parseInt(weeklyRec?.count || "0") || 0,
                    monthly: parseInt(monthlyRec?.count || "0") || 0
                },
                sessions: {
                    completed: parseInt(completedSessions?.count || "0") || 0,
                    noShow: parseInt(noShows?.count || "0") || 0,
                    cancelled: parseInt(cancelledSessions?.count || "0") || 0
                },
                rating: averageRating || 0
            },
            history: history || [],
            lastSession: lastSession || null,
            country: countryRes?.country || null,
            activityData: activityData || [],
            errorsLog: errorsLog || []
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id: userId } = await params

        // Get user info before deletion for logging
        const user = await db.queryOne<any>('SELECT name, role FROM users WHERE id = $1', [userId])
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Permanent deletion - Thorough cleanup of related records that don't cascade
        // 0. Nullify assigned_supervisor_id (NO ACTION FK - must be cleared before deletion)
        await db.query('UPDATE conversations SET assigned_supervisor_id = NULL WHERE assigned_supervisor_id = $1', [userId])

        // 1. Delete bookings (student or reader)
        await db.query('DELETE FROM bookings WHERE student_id = $1 OR reader_id = $1', [userId])

        // 2. Delete recitations (student)
        await db.query('DELETE FROM recitations WHERE student_id = $1', [userId])

        // 3. Delete conversations (student or reader) - messages will cascade
        await db.query('DELETE FROM conversations WHERE student_id = $1 OR reader_id = $1', [userId])

        // 4. Delete notifications
        await db.query('DELETE FROM notifications WHERE user_id = $1 OR related_user_id = $1', [userId])

        // 5. Delete activity logs of this user (but keep logs where they are the entity)
        await db.query('DELETE FROM activity_logs WHERE user_id = $1', [userId])

        // 6. Finally delete the user - profiles, stats, sessions, etc. will cascade from ON DELETE CASCADE in schema
        await db.query('DELETE FROM users WHERE id = $1', [userId])

        // Log admin action (performed by the admin, not the deleted user)
        await db.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [session.sub, 'permanent_delete_user', 'user', userId, `Admin permanently deleted ${user.role} ${user.name}`]
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
